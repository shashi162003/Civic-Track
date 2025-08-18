const Event = require('../models/Event');
const { generateEventDetails } = require('../services/openaiService');
const { addPoints, removePoints } = require('../services/gamificationService');

const createEvent = async (req, res) => {
    const { idea, eventDate, latitude, longitude } = req.body;

    try {
        if (!idea || !eventDate || !latitude || !longitude) {
            return res.status(400).json({ message: "Idea, eventDate, and location are required" });
        }

        const aiDetails = await generateEventDetails(idea);

        const lon = parseFloat(longitude);
        const lat = parseFloat(latitude);

        const newEvent = await Event.create({
            organizer: req.user.id,
            title: aiDetails.title,
            description: aiDetails.description,
            tags: aiDetails.tags,
            eventDate,
            location: {
                type: 'Point',
                coordinates: [lon, lat]
            }
        });

        res.status(201).json(newEvent);

    } catch (error) {
        console.error(`Error creating event: ${error.message}`.red);
        res.status(500).json({ message: "Server Error" });
    }
};

const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ eventDate: { $gte: new Date() } })
            .populate('organizer', 'name')
            .sort({ eventDate: 1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name')
            .populate('attendees', 'name');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const joinEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.attendees.includes(req.user.id)) {
            return res.status(400).json({ message: 'You are already an attendee' });
        }

        event.attendees.push(req.user.id);
        await event.save();
        await addPoints(req.user.id, 'JOIN_EVENT');
        res.status(200).json({ message: 'Successfully joined event' });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const leaveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const wasAttendee = event.attendees.includes(req.user.id);

        event.attendees.pull(req.user.id);
        await event.save();

        if (wasAttendee) {
            await removePoints(req.user.id, 'JOIN_EVENT');
        }

        res.status(200).json({ message: 'Successfully left event' });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { createEvent, getAllEvents, getEventById, joinEvent, leaveEvent };