const Notification = require('../models/Notification');

const createNotification = async (user, message, options = {}) => {
    const { reportId, eventId } = options;

    await Notification.create({
        user,
        message,
        reportId,
        eventId
    });
    console.log(`Notification created for user ${user}`.cyan);
};

module.exports = { createNotification };