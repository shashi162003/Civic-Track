const User = require('../models/User');

const pointValues = {
    CREATE_REPORT: 10,
    RECEIVE_UPVOTE: 2,
    JOIN_EVENT: 5,
};

const levelThresholds = {
    'Community Helper': 50,
    'Civic Champion': 150,
    'Local Hero': 300,
};

const addPoints = async (userId, action) => {
    try {
        const pointsToAdd = pointValues[action];
        if (!pointsToAdd) return;

        const user = await User.findById(userId);
        if (!user) return;

        user.points += pointsToAdd;

        for (const [level, threshold] of Object.entries(levelThresholds).reverse()) {
            if (user.points >= threshold) {
                user.level = level;
                break;
            }
        }

        await user.save();
        console.log(`Awarded ${pointsToAdd} points to user ${userId} for action ${action}`.magenta);
    } catch (error) {
        console.error('Error adding points:', error);
    }
};

const removePoints = async (userId, action) => {
    try {
        const pointsToRemove = pointValues[action];
        if (!pointsToRemove) return;

        const user = await User.findById(userId);
        if (!user) return;

        user.points -= pointsToRemove;
        if (user.points < 0) {
            user.points = 0;
        }

        let newLevel = 'Newcomer';
        for (const [level, threshold] of Object.entries(levelThresholds)) {
            if (user.points >= threshold) {
                newLevel = level;
            }
        }
        user.level = newLevel;

        await user.save();
        console.log(`Deducted ${pointsToRemove} points from user ${userId} for action ${action}`.red);
    } catch (error) {
        console.error('Error removing points:', error);
    }
};

module.exports = { addPoints, removePoints };