const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const connectCloudinary = async () => {
    try{
        const conn = await cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        console.log(`Cloudinary connected: ${conn.cloud_name}`.cyan.underline);
    } catch (error) {
        console.error(`Cloudinary connection error: ${error.message}`.red);
    }
};

module.exports = connectCloudinary;