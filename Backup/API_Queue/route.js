// import { writeFile, unlink, mkdir } from 'fs/promises';
// import path from 'path';
// import { Queue, QueueEvents } from 'bullmq';
// import Papa from 'papaparse';
// import { Buffer } from 'buffer';
// import sanitizeHtml from 'sanitize-html';
// import validator from 'validator';

// const EMAIL_USER = process.env.EMAIL_USER;
// const EMAIL_PASS = process.env.EMAIL_PASS;
// const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
// const RESULT_DIR = path.join(process.cwd(), 'public', 'result');

// const timeZone = 'Asia/Karachi';

// const formatter = new Intl.DateTimeFormat('en-PK', {
//   timeZone,
//   year: 'numeric',
//   month: '2-digit',
//   day: '2-digit',
//   hour: '2-digit',
//   minute: '2-digit',
//   second: '2-digit',
//   hour12: false,
//   timeZoneName: 'short',
// });

// function formatTimestamp(date) {
//   const parts = formatter.formatToParts(date);
//   const year = parts.find((p) => p.type === 'year').value;
//   const month = parts.find((p) => p.type === 'month').value;
//   const day = parts.find((p) => p.type === 'day').value;
//   const hour = parts.find((p) => p.type === 'hour').value;
//   const minute = parts.find((p) => p.type === 'minute').value;
//   const second = parts.find((p) => p.type === 'second').value;
//   const timeZoneName = parts.find((p) => p.type === 'timeZoneName').value;
//   return `${year}-${month}-${day} ${hour}:${minute}:${second} (${timeZoneName})`;
// }

// async function ensureDirectories() {
//   try {
//     await mkdir(UPLOADS_DIR, { recursive: true });
//     await mkdir(RESULT_DIR, { recursive: true });
//   } catch (error) {
//     console.error('Failed to create directories:', error);
//     throw new Error('Server configuration error');
//   }
// }

// function isValidEmail(email) {
//   return validator.isEmail(email);
// }

// function sanitizeEmailBody(html) {
//   return sanitizeHtml(html, {
//     allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
//     allowedAttributes: {
//       ...sanitizeHtml.defaults.allowedAttributes,
//       img: ['src', 'alt', 'width', 'height'],
//     },
//   });
// }

// const QUEUE_NAME = 'emailQueue1';
// const REDIS_CONFIG = {
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
// };

// const emailQueue = new Queue(QUEUE_NAME, {
//   connection: REDIS_CONFIG,
//   defaultJobOptions: {
//     attempts: 2,
//     backoff: {
//       type: 'fixed',
//       delay: 5000,
//     },
//   },
// });

// const queueEvents = new QueueEvents(QUEUE_NAME, {
//   connection: REDIS_CONFIG,
// });

// export async function POST(req) {
//   console.log('Received POST request');

//   try {
//     const formData = await req.formData();
//     const subject = formData.get('subject')?.toString();
//     const body = formData.get('body')?.toString();
//     const interval = parseInt(formData.get('interval')) || 1000;
//     const file = formData.get('file');

//     if (!subject || !body || !file || typeof file === 'string') {
//       return new Response(
//         JSON.stringify({ error: 'Missing required fields or invalid file' }),
//         { status: 400 }
//       );
//     }

//     if (interval < 500) {
//       return new Response(
//         JSON.stringify({ error: 'Interval must be at least 500ms' }),
//         { status: 400 }
//       );
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       return new Response(
//         JSON.stringify({ error: 'File size exceeds 10MB limit' }),
//         { status: 400 }
//       );
//     }

//     await ensureDirectories();

//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
//     const tempFilePath = path.join(UPLOADS_DIR, `${Date.now()}-${file.name}`);

//     try {
//       await writeFile(tempFilePath, buffer);
//       console.log('File saved temporarily at', tempFilePath);

//       const csvContent = buffer.toString('utf-8');
//       if (!csvContent.trim()) {
//         throw new Error('CSV file is empty');
//       }

//       const delimiters = [',', ';', '\t'];
//       let parsed = null;
//       let parseError = null;

//       for (const delimiter of delimiters) {
//         try {
//           parsed = Papa.parse(csvContent, {
//             header: true,
//             skipEmptyLines: true,
//             delimiter,
//             dynamicTyping: false,
//           });

//           if (parsed.errors.length === 0 && parsed.data.length > 0) {
//             console.log(`Successfully parsed CSV with delimiter: '${delimiter}'`);
//             break;
//           }
//         } catch (error) {
//           parseError = error;
//           console.warn(`Failed to parse with delimiter '${delimiter}':`, error.message);
//         }
//       }

//       if (!parsed || parsed.errors.length > 0 || !parsed.data.length) {
//         const errorMessage = parsed?.errors?.length
//           ? `CSV parsing errors: ${parsed.errors.map(e => e.message).join(', ')}`
//           : 'No valid data found in CSV';
//         throw new Error(errorMessage);
//       }

//       const emails = parsed.data
//         .filter((row) => row.emails && isValidEmail(row.emails.trim()))
//         .map((row) => row.emails.trim());

//       if (emails.length === 0) {
//         throw new Error('No valid email addresses found in CSV');
//       }

//       console.log(`Found ${emails.length} valid email(s):`, emails);

//       const sanitizedBody = sanitizeEmailBody(body);

//       let sentCount = 0;
//       const failedEmails = [];

//       const stream = new ReadableStream({
//         async start(controller) {
//           try {
//             const jobPromises = emails.map((email) =>
//               emailQueue.add('send-email', {
//                 email,
//                 subject,
//                 htmlBody: sanitizedBody,
//                 interval,
//               })
//             );

//             const jobs = await Promise.all(jobPromises);
//             console.log(`Queued ${jobs.length} email jobs`);

//             for (const job of jobs) {
//               try {
//                 const result = await job.waitUntilFinished(queueEvents);
//                 sentCount++;
//                 controller.enqueue(
//                   new TextEncoder().encode(
//                     JSON.stringify({
//                       type: 'sent',
//                       email: result.email,
//                       sentCount,
//                       timestamp: formatTimestamp(new Date()),
//                     }) + '\n'
//                   )
//                 );
//               } catch (error) {
//                 console.error(`Failed to process job for ${job.data.email}:`, error);
//                 failedEmails.push({ email: job.data.email, error: error.message });
//                 controller.enqueue(
//                   new TextEncoder().encode(
//                     JSON.stringify({
//                       type: 'failed',
//                       email: job.data.email,
//                       error: error.message,
//                       timestamp: formatTimestamp(new Date()),
//                     }) + '\n'
//                   )
//                 );
//               }
//             }

//             controller.enqueue(
//               new TextEncoder().encode(
//                 JSON.stringify({
//                   type: 'complete',
//                   success: true,
//                   sent: sentCount,
//                   failed: failedEmails.length,
//                   failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
//                   timestamp: formatTimestamp(new Date()),
//                 }) + '\n'
//               )
//             );
//             controller.close();
//           } catch (error) {
//             controller.error(error);
//           }
//         },
//       });

//       try {
//         await unlink(tempFilePath);
//         console.log('Temporary file deleted');
//       } catch (unlinkError) {
//         console.error('Failed to delete temporary file:', unlinkError);
//       }

//       return new Response(stream, {
//         status: 200,
//         headers: {
//           'Content-Type': 'text/event-stream',
//           'Cache-Control': 'no-cache',
//           'Connection': 'keep-alive',
//         },
//       });
//     } catch (error) {
//       try {
//         await unlink(tempFilePath);
//       } catch (unlinkError) {
//         console.error('Failed to delete temporary file:', unlinkError);
//       }
//       throw error;
//     }
//   } catch (error) {
//     console.error('Failed to process request:', error);
//     return new Response(
//       JSON.stringify({ error: error.message || 'Failed to queue emails' }),
//       { status: 500 }
//     );
//   }
// }


// ============================

// backup