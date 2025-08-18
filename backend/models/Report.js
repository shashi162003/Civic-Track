const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: [true, 'A title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    category: {
        type: String,
        required: true,
        enum: ['Waste', 'Roads', 'Lighting', 'Water', 'Other']
    },
    severity: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        }
    },
    imageURL: {
        type: String,
        required: [true, 'Please provide an image URL']
    },
    upvotes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);