const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        room: { type: String, required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
