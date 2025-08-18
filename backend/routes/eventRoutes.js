const express = require('express');
const router = express.Router();

// This is the only import we will use for the test.
const { runReminderCheck } = require('../services/scheduler');

// --- PING ROUTE (WE KNOW THIS WORKS) ---
router.get('/ping', (req, res) => {
    console.log('--- EVENT ROUTER PING SUCCESSFUL ---');
    res.status(200).send('Event router is alive!');
});

// --- DEBUG TEST ROUTE (ISOLATED) ---
router.get('/test-reminders', async (req, res) => {
    console.log('[DEBUG] --- TOP: /test-reminders route handler was hit.');
    try {
        console.log('[DEBUG] --- CALLING: runReminderCheck...');
        const result = await runReminderCheck();

        console.log('[DEBUG] --- SUCCESS: runReminderCheck completed.');
        res.status(200).send(`Reminder job triggered successfully. Sent ${result.count} notifications.`);
    } catch (error) {
        console.error('[DEBUG] --- CATCH BLOCK in /test-reminders route:', error);
        res.status(500).json({
            message: "The reminder check failed. See the error field for details.",
            error: error.message,
            stack: error.stack
        });
    }
});


// --- ALL OTHER EVENT ROUTES ARE TEMPORARILY DISABLED ---

const {
    createEvent,
    getAllEvents,
    getEventById,
    joinEvent,
    leaveEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createEvent)
    .get(getAllEvents);

router.route('/:id')
    .get(getEventById);

router.route('/:id/join')
    .post(protect, joinEvent);

router.route('/:id/leave')
    .post(protect, leaveEvent);


module.exports = router;