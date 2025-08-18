const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    reportId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Report'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);