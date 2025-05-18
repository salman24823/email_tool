import nodemailer from "nodemailer";
import Papa from "papaparse";
import { Buffer } from "buffer";
import sanitizeHtml from "sanitize-html";
import validator from "validator";
import CampaignResultModel from "@/model/campaignResult";
import dbConnection from "@/config/db";

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

// POST handler to create campaign and send emails
export async function POST(req) {
  console.log("Received POST request");

  try {
    const formData = await req.formData();
    const subject = formData.get("subject")?.toString();
    const body = formData.get("body")?.toString();
    const campaignName = formData.get("campaignName")?.toString();
    const interval = parseInt(formData.get("interval")) || 1000;
    const file = formData.get("file");

    if (!subject || !body || !campaignName || !file || typeof file === "string") {
      return new Response(
        JSON.stringify({ error: "Missing required fields or invalid file" }),
        { status: 400 }
      );
    }

    if (interval < 500) {
      return new Response(
        JSON.stringify({ error: "Interval must be at least 500ms" }),
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 10MB limit" }),
        { status: 400 }
      );
    }

    await dbConnection();

    // Parse CSV directly from buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const csvContent = buffer.toString("utf-8");

    if (!csvContent.trim()) {
      throw new Error("CSV file is empty");
    }

    const delimiters = [",", ";", "\t"];
    let parsed = null;
    let parseError = null;

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
        parseError = error;
        console.warn(`Failed to parse with delimiter '${delimiter}':`, error.message);
      }
    }

    if (!parsed || parsed.errors.length > 0 || !parsed.data.length) {
      const errorMessage = parsed?.errors?.length
        ? `CSV parsing errors: ${parsed.errors.map(e => e.message).join(", ")}`
        : "No valid data found in CSV";
      throw new Error(errorMessage);
    }

    const emails = parsed.data
      .filter((row) => row.emails && isValidEmail(row.emails.trim()))
      .map((row) => row.emails.trim());

    if (emails.length === 0) {
      throw new Error("No valid email addresses found in CSV");
    }

    console.log(`Found ${emails.length} valid email(s):`, emails);

    // Save campaign to MongoDB
    const campaign = await CampaignResultModel.create({
      campaignName,
      subject,
      emails: emails.map((email) => ({ email, isSent: false })),
    });

    const sanitizedBody = sanitizeEmailBody(body);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    await transporter.verify();

    let sentCount = 0;
    const failedEmails = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const email of emails) {
            const mailOptions = {
              from: `"Campaign" <${EMAIL_USER}>`,
              to: email,
              subject,
              html: sanitizedBody,
            };

            try {
              await transporter.sendMail(mailOptions);
              sentCount++;

              // Update MongoDB via PUT request
              const putResponse = await fetch(`${BASE_URL}/api/handleMail`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  campaignId: campaign._id,
                  email,
                  isSent: true,
                }),
              });

              if (!putResponse.ok) {
                console.error(`Failed to update MongoDB for ${email}:`, await putResponse.text());
              }

              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "sent",
                    email,
                    sentCount,
                    timestamp: new Date().toISOString(),
                  }) + "\n"
                )
              );
            } catch (error) {
              console.error(`Failed to send email to ${email}:`, error);
              failedEmails.push({ email, error: error.message });

              // Update MongoDB via PUT request for failed email
              const putResponse = await fetch(`${BASE_URL}/api/handleMail`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  campaignId: campaign._id,
                  email,
                  isSent: false,
                }),
              });

              if (!putResponse.ok) {
                console.error(`Failed to update MongoDB for ${email}:`, await putResponse.text());
              }

              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "failed",
                    email,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                  }) + "\n"
                )
              );
            }

            if (interval > 0 && email !== emails[emails.length - 1]) {
              console.log(`Waiting ${interval}ms before next email`);
              await new Promise((res) => setTimeout(res, interval));
            }
          }

          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "complete",
                success: true,
                sent: sentCount,
                failed: failedEmails.length,
                failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
                timestamp: new Date().toISOString(),
              }) + "\n"
            )
          );
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "error",
                error: error.message || "Stream processing failed",
                timestamp: new Date().toISOString(),
              }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to process request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send emails" }),
      { status: 500 }
    );
  }
}