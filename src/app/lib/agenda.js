import { Agenda } from "agenda";
import nodemailer from "nodemailer";
import CampaignResultModel from "@/model/campaignResult";
import dbConnection from "@/config/db";

// Validate environment variables
const requiredEnvVars = ["MONGODB_URI", "EMAIL_USER", "EMAIL_PASS"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize Agenda
const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: "agendaJobs",
    options: {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    },
  },
  processEvery: "30 seconds",
  maxConcurrency: 20,
});

// Ensure MongoDB connection is ready
let isAgendaStarted = false;

export async function startAgenda() {
  if (isAgendaStarted) {
    console.log("Agenda already started");
    return;
  }

  try {
    // Ensure MongoDB connection
    await dbConnection();
    console.log("MongoDB is connected for Agenda");

    // Start Agenda
    await agenda.start();
    isAgendaStarted = true;
    console.log("Agenda started successfully");
  } catch (error) {
    console.error("Failed to start Agenda:", error);
    throw error;
  }
}

// Handle process termination to gracefully close Agenda
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM. Shutting down Agenda...");
  await agenda.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Shutting down Agenda...");
  await agenda.stop();
  process.exit(0);
});

// Define email campaign job
agenda.define("send-email-campaign", async (job) => {
  const { campaignId, subject, body, emails, interval } = job.attrs.data;
  console.log(`Starting email campaign job for campaignId: ${campaignId}`);

  try {
    // Ensure MongoDB connection
    await dbConnection();

    // Initialize nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter
    try {
      await transporter.verify();
    } catch (error) {
      console.error("Transporter verification failed:", error);
      await CampaignResultModel.updateOne(
        { _id: campaignId },
        {
          $set: {
            status: "failed",
            failedReason: "Email transporter verification failed",
            completedAt: new Date(),
          },
        }
      );
      throw new Error(`Transporter verification failed: ${error.message}`);
    }

    let sentCount = 0;
    const failedEmails = [];

    // Update campaign status to running
    await CampaignResultModel.updateOne(
      { _id: campaignId },
      { $set: { status: "running" } }
    );

    // Process emails
    for (const email of emails) {
      const mailOptions = {
        from: `"Campaign" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: body,
      };

      try {
        await transporter.sendMail(mailOptions);
        sentCount++;

        // Update MongoDB for successful email
        await CampaignResultModel.updateOne(
          { _id: campaignId, "emails.email": email },
          { $set: { "emails.$.isSent": true, "emails.$.timestamp": new Date() } }
        );

        // Update job progress
        job.attrs.progress = {
          sent: sentCount,
          failed: failedEmails.length,
          total: emails.length,
        };
        try {
          await job.save();
        } catch (saveError) {
          console.error(`Failed to save job progress for ${email}:`, saveError);
        }
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        failedEmails.push({ email, error: error.message });

        // Update MongoDB for failed email
        await CampaignResultModel.updateOne(
          { _id: campaignId, "emails.email": email },
          { $set: { "emails.$.isSent": false, "emails.$.timestamp": new Date() } }
        );
      }

      if (interval > 0 && email !== emails[emails.length - 1]) {
        console.log(`Waiting ${interval}ms before next email`);
        await new Promise((res) => setTimeout(res, interval));
      }
    }

    // Update campaign status to completed
    await CampaignResultModel.updateOne(
      { _id: campaignId },
      {
        $set: {
          status: "completed",
          sentCount,
          failedCount: failedEmails.length,
          failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
          completedAt: new Date(),
        },
      }
    );

    console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedEmails.length} failed`);
  } catch (error) {
    console.error(`Job failed for campaignId ${campaignId}:`, error);
    await CampaignResultModel.updateOne(
      { _id: campaignId },
      {
        $set: {
          status: "failed",
          failedReason: error.message || "Job processing failed",
          completedAt: new Date(),
        },
      }
    );
    throw error;
  }
});

// Export agenda instance
export { agenda };