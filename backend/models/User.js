const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide a name"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['Citizen', 'Authority', 'Admin'],
        default: 'Citizen'
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);