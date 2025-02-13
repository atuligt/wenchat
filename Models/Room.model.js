const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    roomId: { type: String, unique: true, required: true },
    roomName: { type: String, required: true },
    roomOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Room", RoomSchema);