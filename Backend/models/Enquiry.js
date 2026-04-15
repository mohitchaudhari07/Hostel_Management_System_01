const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    course: { type: String, required: true },
    preferredRoomType: { type: String, required: true },
    status: {
      type: String,
      enum: ["New", "Contacted", "Interested", "Final", "Joined"],
      default: "New"
    },


    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
