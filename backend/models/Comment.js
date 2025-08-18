const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Comment text cannot be empty'],
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Report'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);