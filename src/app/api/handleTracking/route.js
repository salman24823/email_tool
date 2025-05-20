import dbConnection from "@/config/db";
import campaignResult from "@/model/campaignResult";

export default async function GET() {
  try {
    await dbConnection();

    const emailRecord = await campaignResult.find();

    if (!emailRecord) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true, email, isSent }), {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to update email status:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update email status" }),
      { status: 500 }
    );
  }
}
