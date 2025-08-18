const cron = require('node-cron');
const Event = require('../models/Event');
const { createNotification } = require('./notificationService');

const startEventReminders = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('Running scheduled job: Checking for upcoming event reminders...'.yellow);
        await runReminderCheck();
    });
};

const runReminderCheck = async () => {
    console.log('[DEBUG] --- Step 1: Entering runReminderCheck function.');
    let notificationsSent = 0;
    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        console.log('[DEBUG] --- Step 2: Querying for upcoming events...');
        const upcomingEvents = await Event.find({
            eventDate: { $gte: now, $lte: in24Hours }
        });
        console.log(`[DEBUG] --- Step 3: Found ${upcomingEvents.length} events.`);

        for (const event of upcomingEvents) {
            const message = `Reminder: Your event "${event.title}" is starting soon!`;
            for (const attendeeId of event.attendees) {
                console.log(`[DEBUG] --- Step 4: Creating notification for event ${event._id} and attendee ${attendeeId}...`);
                await createNotification(attendeeId, message, { eventId: event._id });
                notificationsSent++;
            }
        }

        console.log(`[DEBUG] --- Step 5: Reminder check complete. Sent ${notificationsSent} notifications.`);
        return { success: true, count: notificationsSent };
    } catch (error) {
        console.error('[DEBUG] --- CRITICAL ERROR INSIDE runReminderCheck ---', error);
        throw error;
    }
};

module.exports = { startEventReminders, runReminderCheck };