import { readdir, readFile } from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';
import Papa from 'papaparse';

export async function POST(req) {
  console.log('Received POST request');

  const formData = await req.formData();
  console.log('Parsed formData');

  const subject = formData.get('subject');
  const body = formData.get('body');
  const interval = parseInt(formData.get('interval')) || 1000;

  console.log('Form fields:', { subject, interval });

  if (!subject || !body) {
    console.error('Subject or body missing');
    return new Response(JSON.stringify({ error: 'Subject and body are required' }), { status: 400 });
  }

  try {
    const audienceDir = path.join(process.cwd(), 'public', 'audience');
    console.log('Reading CSV files from:', audienceDir);

    const files = await readdir(audienceDir);
    const csvFiles = files.filter((file) => file.endsWith('.csv'));

    if (csvFiles.length === 0) {
      console.error('No CSV files found in audience folder');
      return new Response(JSON.stringify({ error: 'No CSV files found in audience folder' }), { status: 400 });
    }

    let allEmails = new Set();

    for (const file of csvFiles) {
      const filePath = path.join(audienceDir, file);
      console.log(`Reading CSV file: ${file}`);

      // Read file as UTF-8
      const csvContent = await readFile(filePath, 'utf-8');
      console.log(`Raw CSV content for ${file}:\n`, csvContent.slice(0, 500), '...'); // Log first 500 chars for debugging

      // Parse CSV with multiple delimiter options
      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        delimitersToGuess: [',', ';', '\t', '|'], // Try common delimiters
        transform: (value) => value.trim(), // Trim whitespace from values
      });

      if (parsed.errors.length > 0) {
        console.error(`Errors parsing ${file}:`, parsed.errors);
      }

      // Check if 'emails' column exists
      const fields = parsed.meta.fields || [];
      if (!fields.includes('emails')) {
        console.error(`No 'emails' column found in ${file}. Found fields:`, fields);
        continue;
      }

      console.log(`Parsed data for ${file}:`, parsed.data.slice(0, 5)); // Log first 5 rows for debugging

      // Extract valid emails
      const emails = parsed.data
        .map((row) => row.emails)
        .filter((email) => {
          if (!email || email.toLowerCase() === 'null' || typeof email !== 'string') {
            return false;
          }
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });

      console.log(`Valid emails from ${file}:`, emails);

      emails.forEach((email) => allEmails.add(email));
    }

    const uniqueEmails = [...allEmails];
    console.log('Unique emails:', uniqueEmails);

    if (uniqueEmails.length === 0) {
      console.error('No valid email addresses found');
      return new Response(JSON.stringify({ error: 'No valid email addresses found' }), { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER || 'nouman3946@gmail.com',
        pass: process.env.EMAIL_PASS || 'myyc cvxb kaxk qixn',
      },
    });

    for (let i = 0; i < uniqueEmails.length; i++) {
      const mailOptions = {
        from: '"nouman3946@gmail.com"',
        to: uniqueEmails[i],
        subject: subject,
        html: body,
      };

      console.log(`Sending email to ${uniqueEmails[i]}...`);
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${uniqueEmails[i]}`);

      if (interval > 0 && i < uniqueEmails.length - 1) {
        console.log(`Waiting ${interval}ms before next email`);
        await new Promise((res) => setTimeout(res, interval));
      }
    }

    return new Response(JSON.stringify({ success: true, sent: uniqueEmails.length }), { status: 200 });
  } catch (error) {
    console.error('Failed to send emails:', error);
    return new Response(JSON.stringify({ error: 'Failed to send emails' }), { status: 500 });
  }
}