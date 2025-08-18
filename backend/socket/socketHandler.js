const User = require('../models/User');
const { moderateContent, summarizeDistressCall } = require('../services/openaiService');

const onlineUsers = new Map();

const initializeSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`A user connected: ${socket.id}`.cyan);

        const userId = socket.handshake.query.userId;
        if (userId) {
            onlineUsers.set(userId, socket.id);
            console.log(`User ${userId} is online`.blue);
        }

        socket.on('updateLocation', async (data) => {
            const { userId, latitude, longitude } = data;
            await User.findByIdAndUpdate(userId, {
                lastKnownLocation: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                }
            });
        });

        socket.on('distressCall', async (data) => {
            const { userId, latitude, longitude, message } = data;
            console.log(`Distress call from ${userId} with message: "${message}"`.red.bold);

            const isFlagged = await moderateContent(message);
            if (isFlagged) {
                console.log(`Distress call from ${userId} flagged as inappropriate and was blocked.`.red);
                return;
            }

            const summary = await summarizeDistressCall(message);

            const nearbyUsers = await User.find({
                _id: { $ne: userId },
                lastKnownLocation: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                        $maxDistance: 1000
                    }
                }
            }).select('_id');

            nearbyUsers.forEach(user => {
                const userSocketId = onlineUsers.get(user._id.toString());
                if (userSocketId) {
                    io.to(userSocketId).emit('distressAlert', {
                        fromUserId: userId,
                        latitude,
                        longitude,
                        summary,
                        originalMessage: message
                    });
                    console.log(`Sent distress alert to ${user._id}`.yellow);
                }
            });
        });

        socket.on('disconnect', () => {
            for (let [key, value] of onlineUsers.entries()) {
                if (value === socket.id) {
                    onlineUsers.delete(key);
                    break;
                }
            }
            console.log(`A user disconnected: ${socket.id}`.grey);
        });
    });
};

module.exports = initializeSocket;