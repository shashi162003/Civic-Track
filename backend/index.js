const express = require("express");
require("dotenv").config();
const colors = require("colors");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const connectCloudinary = require("./config/cloudinary");
const notificationRoutes = require("./routes/notificationRoutes");
const healthRoutes = require("./routes/healthRoutes");
const eventRoutes = require("./routes/eventRoutes");
const gamificationRoutes = require("./routes/gamificationRoutes");
const http = require('http');
const { Server } = require("socket.io");
const { startEventReminders } = require('./services/scheduler');

const PORT = process.env.PORT || 5000;

const app = express();

const origins = process.env.allowedOrigins.split(",");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: origins,
        methods: ["GET", "POST"],
        credentials: true
    }
});
const initializeSocket = require('./socket/socketHandler');
initializeSocket(io);


app.use(express.json());
app.use(cookieParser());

connectDB();
connectCloudinary();

app.use("/api/users", userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/leaderboard', gamificationRoutes);

startEventReminders();

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CivicConnect API running smoothly"
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`.green);
})