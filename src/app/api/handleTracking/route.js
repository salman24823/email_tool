// app/api/handleTracking/route.js

import dbConnection from "@/config/db";
import campaignResult from "@/model/campaignResult";

export default revalidate = 0

export async function GET() {
  try {
    await dbConnection();
    const emailRecord = await campaignResult.find();

    if (!emailRecord) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, emailRecord }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to fetch email data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch email data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
