const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Room = require("../Models/Room.model")
const Message = require("../Models/Message.model")
const crypto = require("crypto");


const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "DELETE"]
        }
    });
    
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            console.log(" No token provided. Connection rejected.");
            return next(new Error("Authentication error: Token required"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            socket.user = decoded;
            console.log(` User authenticated: ${decoded.userEmail}`);
            next();
        } catch (error) {
            console.log(" Invalid token. Connection rejected.");
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(` New user connected: ${socket.id} (User ID: ${socket.user.userId})`);
        socket.onAny((event, ...args) => {
            console.log(`📥 Received Event: ${event}`, args);
        });

        socket.on("createRoom", async ({ roomName }) => {
            if (!roomName) {
                console.log(" Group name  missing!");
                return;
            }
            const roomId = crypto.randomUUID();
            const newRoom = new Room({
                roomId,
                roomName: roomName,
                roomOwner: socket.user.userId
            });

            await newRoom.save();
            console.log(`Room created: ${roomName} (Room ID: ${roomId})`);
            socket.emit("roomCreated", { roomId, roomName });
        });

        socket.on("joinRoom", async ({ roomId }) => {
            if (!roomId) {
                console.log("Room ID is missing!");
                return;
            }
            const room = await Room.findOne({ roomId });

            if (!room) {
                console.log(" Room not found!");
                socket.emit("error", { message: "Room does not exist" });
                return;
            }

            if (!room.participants.includes(socket.user.userId)) {
                room.participants.push(socket.user.userId);
                await room.save();
                console.log(` Added ${socket.user.userEmail} to room: ${roomId}`);
            } else {
                console.log(` ${socket.user.userEmail} is already in room: ${roomId}`);
            }

            const messages = await Message.find({ room: roomId })
                .sort({ timestamp: -1 })
                .limit(50)
                .populate("sender", "email");

            socket.join(roomId);
            console.log(` User ${socket.user.userEmail} joined room: ${roomId}`);

            socket.to(roomId).emit("userJoined", { userId: socket.id });

            socket.emit("joinedRoom", {
                user: socket.user.userEmail,
                roomId
            });

            socket.emit("getRoomChat", {
                messages
            });
        });


        socket.on("sendMessage", async ({ roomId, message }) => {
            if (!roomId || !message) {
                console.log(" Missing roomId or message data!");
                return;
            }
            const room = await Room.findOne({ roomId });
            if (!room) {
                console.log(" Room not found!");
                socket.emit("error", { message: "Room does not exist" });
                return;
            }
            console.log(` Message in ${roomId} from ${socket.user.userEmail}: ${message}`);
            const newMessage = new Message({
                room: roomId,
                sender: socket.user.userId,
                message
            });
            await newMessage.save();

            socket.to(roomId).emit("receiveMessage", {
                user: socket.user.userEmail,
                message
            });

            // socket.emit("messageSent", { success: true, message });
            socket.emit("messageSent", { success: true, message, messageId: newMessage._id });
        });


        socket.on("getMsgById", async ({ roomId,messageId }) => {
            if (!messageId || !roomId) {
                console.log(" Missing message Id or Room Id!");
                return;
            }
            const message =await Message.find({ room: roomId, _id:messageId })
            if (!message) {
                console.log(" message not found!");
                socket.emit("error", { message: "message does not exist" });
                return;
            }
            console.log(` Message: ${message}`);
           
            socket.emit("getMessageById", { message });
        });


        socket.on("deleteMessage", async ({ messageId }) => {
            if (!messageId) {
                console.log("Message ID is missing!");
                socket.emit("error", { message: "Message ID is required" });
                return;
            }

            try {
                const message = await Message.findById(messageId);

                if (!message) {
                    console.log("Message not found!");
                    socket.emit("error", { message: "Message not found" });
                    return;
                }

                if (message.sender.toString() !== socket.user.userId) {
                    console.log(" Unauthorized delete attempt!");
                    socket.emit("error", { message: "You can only delete your own messages" });
                    return;
                }
                if (message.isDeleted) {
                    socket.emit("error", {
                        message: "Message already deleted"
                    })
                    return;
                }
                message.isDeleted = true;
                await message.save();
                console.log(`Message deleted: ${messageId}`);
                console.log("message Id", message.room.toString())
                io.to(message.room).emit("messageDeleted", {
                    user: socket.user.userEmail,
                    message: "message deleted successfully!",
                    messageId
                });
            } catch (error) {
                console.error(" Error deleting message:", error);
                socket.emit("error", { message: "Server error while deleting message" });
            }
        });

        socket.on("undoDeleteMessage", async ({ messageId }) => {
            if (!messageId) {
                console.log(" Message ID is missing!");
                socket.emit("error", { message: "Message ID is required" });
                return;
            }
            try {
                const message = await Message.findById(messageId);
                if (!message) {
                    console.log(" Message not found!");
                    socket.emit("error", { message: "Message not found" });
                    return;
                }

                if (message.sender.toString() !== socket.user.userId) {
                    console.log(" Unauthorized undo attempt!");
                    socket.emit("error", { message: "You can only undo your own messages" });
                    return;
                }

                if (!message.isDeleted) {
                    console.log(" Message is already visible!");
                    socket.emit("error", { message: "Message is already visible" });
                    return;
                }
                message.isDeleted = false;
                await message.save();

                console.log(` Message restored: ${message.message}`);
                io.to(message.room).emit("messageRestored", {
                    messageId,
                    message: message.message
                });
            } catch (error) {
                console.error(" Error undoing message:", error);
                socket.emit("error", { message: "Server error while restoring message" });
            }
        });

        socket.on("offer", ({ offer, roomId }) => {
            console.log(` Offer received from ${socket.user.userEmail} for room ${roomId}`);
            socket.to(roomId).emit("receiveOffer", { offer, senderId: socket.id });
        });

        socket.on("answer", ({ answer, roomId, targetId }) => {
            console.log("ANSWER SENDS>>>>>>>>>>>>>>>", targetId)
            io.to(targetId).emit("receiveAnswer", { answer, senderId: socket.id });
        });

        socket.on("iceCandidate", ({ candidate, roomId }) => {
            console.log(` ICE Candidate received from ${socket.user.userEmail} for room ${roomId}`);
            socket.to(roomId).emit("receiveIceCandidate", { candidate, senderId: socket.id });
        });
        socket.on("leaveVideoRoom", ({ roomId }) => {
            socket.leave(roomId);
            console.log(` User ${socket.user.userEmail} left video room: ${roomId}`);
            socket.to(roomId).emit("userLeft", { userId: socket.id });
        });
        socket.on("forceDisconnect", () => {
            console.log(` Force disconnecting user: ${socket.id}`);
            socket.disconnect(true);
        });

        socket.on("error", (err) => {
            console.error(" Socket error:", err);
        });
    });
    return io;
};
module.exports = setupSocket;
