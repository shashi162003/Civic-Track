const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URL = process.env.MONGODB_URL;

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB connected: ${conn.connection.host}`.cyan.underline);
    }
    catch(error){
        console.error(`MongoDB connection error: ${error.message}`.red.underline);
        process.exit(1);
    }
}

module.exports = connectDB;