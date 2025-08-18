const express = require("express");
require("dotenv").config();
const colors = require("colors");
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoutes");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cookieParser());

connectDB();

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CivicConnect API running smoothly"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`.green);
})