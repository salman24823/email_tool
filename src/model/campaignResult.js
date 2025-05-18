import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  campaignName: {
    type: String,
  },
  subject: {
    type: String,
  },
  emails: [
    {
      email: { type: String },
      isSent: { type: Boolean, default: false },
      timestamp: { type: Date },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CampaignResultModel =
  mongoose.models.CampaignResult ||
  mongoose.model("CampaignResult", ResultSchema);

export default CampaignResultModel;
