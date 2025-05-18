import nodemailer from "nodemailer";
import Papa from "papaparse";
import { Buffer } from "buffer";
import sanitizeHtml from "sanitize-html";
import validator from "validator";
import CampaignResultModel from "@/model/campaignResult";
import dbConnection from "@/config/db";
import { agenda } from "@/app/lib/agenda";
import { startAgenda } from "@/app/lib/agenda";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function isValidEmail(email) {
  return validator.isEmail(email);
}

function sanitizeEmailBody(html) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "style"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
      "*": ["style"],
    },
    allowVulnerableTags: true,
  });
}

// POST handler to create campaign and schedule email sending job
export async function POST(req) {

  await startAgenda()

  console.log("Received POST request");

  try {
    const formData = await req.formData();
    const subject = formData.get("subject")?.toString();
    const body = formData.get("body")?.toString();
    const campaignName = formData.get("campaignName")?.toString();
    const interval = parseInt(formData.get("interval")) || 1000;
    const file = formData.get("file");

    // Validate required fields
    if (!subject || !body || !campaignName || !file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "Missing required fields or invalid file" }),
        { status: 400 }
      );
    }

    // Validate interval
    if (interval < 500) {
      return new Response(
        JSON.stringify({ error: "Interval must be at least 500ms" }),
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 10MB limit" }),
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await dbConnection();

    // Parse CSV from buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const csvContent = buffer.toString("utf-8");

    if (!csvContent.trim()) {
      return new Response(
        JSON.stringify({ error: "CSV file is empty" }),
        { status: 400 }
      );
    }

    const delimiters = [",", ";", "\t"];
    let parsed = null;

    for (const delimiter of delimiters) {
      try {
        parsed = Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          delimiter,
          dynamicTyping: false,
        });

        if (parsed.errors.length === 0 && parsed.data.length > 0) {
          console.log(`Successfully parsed CSV with delimiter: '${delimiter}'`);
          break;
        }
      } catch (error) {
        console.warn(`Failed to parse with delimiter '${delimiter}':`, error.message);
      }
    }

    if (!parsed || parsed.errors.length > 0 || !parsed.data.length) {
      const errorMessage = parsed?.errors?.length
        ? `CSV parsing errors: ${parsed.errors.map(e => e.message).join(", ")}`
        : "No valid data found in CSV";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400 }
      );
    }

    // Extract and validate emails
    const emails = parsed.data
      .filter((row) => row.emails && isValidEmail(row.emails.trim()))
      .map((row) => row.emails.trim());

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid email addresses found in CSV" }),
        { status: 400 }
      );
    }

    console.log(`Found ${emails.length} valid email(s):`, emails);

    // Sanitize email body
    const sanitizedBody = sanitizeEmailBody(body);

    // Save campaign to MongoDB
    const campaign = await CampaignResultModel.create({
      campaignName,
      subject,
      emails: emails.map((email) => ({ email, isSent: false })),
      status: "pending",
    });

    // Schedule Agenda job
    await agenda.schedule("in 1 minute", "send-email-campaign", {
      campaignId: campaign._id,
      subject,
      body: sanitizedBody,
      emails,
      interval,
    });

    console.log(`Scheduled email campaign job for campaignId: ${campaign._id}`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        campaignId: campaign._id,
        message: "Campaign created and email sending job scheduled",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to process request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to schedule campaign" }),
      { status: 500 }
    );
  }
}

// PUT handler to update email status
export async function PUT(req) {
  try {
    await dbConnection();
    const { campaignId, email, isSent } = await req.json();

    if (!campaignId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing campaignId or email" }),
        { status: 400 }
      );
    }

    const updateData = {
      "emails.$.isSent": isSent,
      "emails.$.timestamp": new Date(),
    };

    const result = await CampaignResultModel.updateOne(
      { _id: campaignId, "emails.email": email },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Email not found or no changes made" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, email, isSent }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update email status:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update email status" }),
      { status: 500 }
    );
  }
}

// GET handler to check campaign status
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "Missing campaignId" }),
        { status: 400 }
      );
    }

    await dbConnection();
    const campaign = await CampaignResultModel.findById(campaignId);

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        campaignId,
        campaignName: campaign.campaignName,
        status: campaign.status,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        failedEmails: campaign.failedEmails,
        completedAt: campaign.completedAt,
        failedReason: campaign.failedReason,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch campaign status:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch campaign status" }),
      { status: 500 }
    );
  }
}