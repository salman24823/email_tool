require('dotenv').config();
const { Queue, Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { appendFile, writeFile } = require('fs/promises');
const path = require('path');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const RESULT_DIR = path.join(process.cwd(), 'public', 'result');
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};
const QUEUE_NAME = 'emailQueue';
const timeZone = 'Asia/Karachi';

const formatter = new Intl.DateTimeFormat('en-PK', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZoneName: 'short',
});

function formatTimestamp(date) {
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year').value;
  const month = parts.find((p) => p.type === 'month').value;
  const day = parts.find((p) => p.type === 'day').value;
  const hour = parts.find((p) => p.type === 'hour').value;
  const minute = parts.find((p) => p.type === 'minute').value;
  const second = parts.find((p) => p.type === 'second').value;
  const timeZoneName = parts.find((p) => p.type === 'timeZoneName').value;
  return `${year}-${month}-${day} ${hour}:${minute}:${second} (${timeZoneName})`;
}

async function logSentEmail(email, status) {
  const timestamp = formatTimestamp(new Date());
  const logEntry = `"${email}","${timestamp}"\n`;
  const logFilePath = path.join(RESULT_DIR, 'mailsent.csv');
  try {
    try {
      await appendFile(logFilePath, logEntry);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await writeFile(logFilePath, 'email,timestamp\n');
        await appendFile(logFilePath, logEntry);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(`Failed to log email ${email}:`, error);
  }
}

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { email, subject, htmlBody, interval } = job.data;

    try {
      await transporter.sendMail({
        from: `"Arafa Webs" <${EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlBody,
      });

      await logSentEmail(email, 'success');
      console.log(`Email sent to ${email}`);

      if (interval > 0) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      return { email, status: 'success' };
    } catch (error) {
      await logSentEmail(email, `failed: ${error.message}`);
      console.error(`Failed to send email to ${email}:`, error);
      throw error;
    }
  },
  {
    connection: REDIS_CONFIG,
    concurrency: 1,
  }
);

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await worker.close();
  process.exit(0);
});