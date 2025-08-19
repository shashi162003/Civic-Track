const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Not authorized, user not found in token' });
        }

        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        if (!Array.isArray(notifications)) {
            console.error("Database query for notifications did not return an array.");
            return res.status(500).json({ message: 'Internal server error: Invalid data format.' });
        }

        res.status(200).json(notifications);

    } catch (error) {
        console.error(`Error fetching notifications for user ${req.user?.id}:`, error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const markNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { $set: { read: true } }
        );
        console.log(`Marked notifications as read for user ${req.user.id}`.blue);
        res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getNotifications, markNotificationsAsRead };