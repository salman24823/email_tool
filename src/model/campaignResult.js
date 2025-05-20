import mongoose from "mongoose";

const campaignResultSchema = new mongoose.Schema({
  campaignName: { type: String, required: true },
  subject: { type: String, required: true },
  emails: [
    {
      email: { type: String, required: true },
      isSent: { type: Boolean, default: false },
      timestamp: { type: Date },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "running", "completed"],
    default: "pending",
  },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  failedEmails: [
    {
      email: String,
      error: String,
    },
  ],
  completedAt: { type: Date },
});

// Export the model, reusing it if already defined
export default mongoose.models.CampaignResult ||
  mongoose.model("CampaignResult", campaignResultSchema);
