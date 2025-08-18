const User = require('../models/User');

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.find()
            .sort({ points: -1 })
            .limit(10)
            .select('name points level');

        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getLeaderboard };