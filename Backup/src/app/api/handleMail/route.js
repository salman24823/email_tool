import { writeFile, unlink } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import Papa from "papaparse";
import { Buffer } from "buffer";

export async function POST(req) {
  console.log("Received POST request");

  const formData = await req.formData();
  console.log("Parsed formData");

  const subject = formData.get("subject");
  const body = formData.get("body");
  const interval = parseInt(formData.get("interval"));
  const file = formData.get("file");

  console.log("Form fields:", { subject, interval, fileName: file?.name });

  if (!file || typeof file === "string") {
    console.error("CSV file missing or invalid");
    return new Response(JSON.stringify({ error: "CSV file missing or invalid" }), { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("Converted file to buffer");

    const uploadsDir = path.join(process.cwd(), "uploads");
    const tempFilePath = path.join(uploadsDir, file.name);
    await writeFile(tempFilePath, buffer);
    console.log("File saved temporarily at", tempFilePath);

    const csvContent = buffer.toString("utf-8");
    const parsed = Papa.parse(csvContent, { header: true });

    const emails = parsed.data
      .filter((row) => row.emails)
      .map((row) => row.emails.trim());

    console.log("Parsed emails:", emails);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      auth: {
        user: "nouman3946@gmail.com",
        pass: "myyc cvxb kaxk qixn",
      },
    });

    for (let i = 0; i < emails.length; i++) {
      const mailOptions = {
        from: '"nouman3946@gmail.com"',
        to: emails[i],
        subject: subject,
        html: body,
      };

      console.log(`Sending email to ${emails[i]}...`);

      await transporter.sendMail(mailOptions);

      console.log(`Email sent to ${emails[i]}`);

      if (interval > 0 && i < emails.length - 1) {
        console.log(`Waiting ${interval}ms before next email`);
        await new Promise((res) => setTimeout(res, interval));
      }
    }

    await unlink(tempFilePath);
    // console.log("Temporary file deleted");

    return new Response(JSON.stringify({ success: true, sent: emails.length }), { status: 200 });
  } catch (error) {
    console.error("Failed to send emails:", error);
    return new Response(JSON.stringify({ error: "Failed to send emails" }), { status: 500 });
  }
}
