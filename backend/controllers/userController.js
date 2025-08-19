const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        })

        console.log(`User registration successful: ${user.email}`.green);
        console.log(`${user}`.blue);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                message: "Registration successful. Please log in."
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(`Error registering user: ${error.message}`.red);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const loginUser = async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: "Request body is missing or malformed" });
    }
    console.log(req.body);
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const user = await User.findOne({ email });

        const isMatched = await bcrypt.compare(password, user.password);

        if (!isMatched) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user && isMatched) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

            user.otp = otp;
            user.otpExpires = otpExpires;

            console.log(`OTP generated for user ${user.email}: ${otp}`.yellow);

            await user.save();

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
            })

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Your CivicConnect Verification Code',
                text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
            }

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                success: true,
                message: "OTP sent to your email"
            })
        }
    }
    catch (error) {
        console.error(`Error during login: ${error.message}`.red);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const options = {
            expiresIn: '1d',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        };

        console.log(`User ${user.email} logged in successfully`.green);

        res.cookie("token", token, options);

        return res.status(200).json({
            message: "Login successful!",
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: token,
        });
    }
    catch (error) {
        console.error(`Error during OTP verification: ${error.message}`.red);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { registerUser, loginUser, verifyOtp };