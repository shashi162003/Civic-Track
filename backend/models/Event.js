const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an event title'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere',
        },
    },
    eventDate: {
        type: Date,
        required: [true, 'Please provide an event date and time'],
    },
    tags: [{
        type: String,
        trim: true,
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);