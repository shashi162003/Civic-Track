const Notification = require('../models/Notification');

const createNotification = async (user, message, reportId) => {
    try {
        await Notification.create({
            user,
            message,
            reportId
        });
        console.log(`Notification created for user ${user}`.cyan);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = { createNotification };