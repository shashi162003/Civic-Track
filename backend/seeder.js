const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Report = require('./models/Report');
const User = require('./models/User');
const connectDB = require('./config/database');

dotenv.config();

connectDB();

const seedReports = async () => {
    try {
        await Report.deleteMany();
        console.log('Reports destroyed...'.red.inverse);

        const user = await User.findOne();
        if (!user) {
            console.error('No users found in the database. Please register a user first.'.red.bold);
            process.exit(1);
        }
        const userId = user._id;

        const reports = [
            {
                user: userId,
                title: 'Massive Pothole on Main Street',
                description: 'A deep pothole near the central market is causing traffic issues. It needs to be fixed urgently.',
                category: 'Roads',
                severity: 'High',
                status: 'Pending',
                imageURL: 'https://via.placeholder.com/350/ff0000/FFFFFF?text=Pothole',
                location: { type: 'Point', coordinates: [85.439, 23.412] }
            },
            {
                user: userId,
                title: 'Overflowing Garbage Bin',
                description: 'The garbage bin at the park entrance has been overflowing for three days. The trash is spreading.',
                category: 'Waste',
                severity: 'Medium',
                status: 'Pending',
                imageURL: 'https://via.placeholder.com/350/f2a70c/FFFFFF?text=Garbage',
                location: { type: 'Point', coordinates: [85.435, 23.415] }
            },
            {
                user: userId,
                title: 'Broken Street Light',
                description: 'The street light on Oak Avenue is broken, making the area very dark and unsafe at night.',
                category: 'Lighting',
                severity: 'High',
                status: 'In Progress',
                imageURL: 'https://via.placeholder.com/350/403d3d/FFFFFF?text=Broken+Light',
                location: { type: 'Point', coordinates: [85.442, 23.410] }
            },
            {
                user: userId,
                title: 'Leaking Water Pipe',
                description: 'There is a water pipe leaking near the bus stop, wasting a lot of clean water.',
                category: 'Water',
                severity: 'Medium',
                status: 'Resolved',
                imageURL: 'https://via.placeholder.com/350/0000ff/FFFFFF?text=Water+Leak',
                location: { type: 'Point', coordinates: [85.430, 23.418] }
            },
            {
                user: userId,
                title: 'Uncollected Trash Pile',
                description: 'A large pile of uncollected trash is sitting at the corner of Pine and Elm street.',
                category: 'Waste',
                severity: 'High',
                status: 'Pending',
                imageURL: 'https://via.placeholder.com/350/f2a70c/FFFFFF?text=Trash+Pile',
                location: { type: 'Point', coordinates: [85.428, 23.411] }
            },
            {
                user: userId,
                title: 'Flickering Park Light',
                description: 'The light in the children\'s play area is flickering and needs repair.',
                category: 'Lighting',
                severity: 'Low',
                status: 'Resolved',
                imageURL: 'https://via.placeholder.com/350/403d3d/FFFFFF?text=Flickering+Light',
                location: { type: 'Point', coordinates: [85.436, 23.416] }
            }
        ];

        await Report.insertMany(reports);
        console.log('Data seeded successfully!'.green.inverse);
        process.exit();

    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Report.deleteMany();
        console.log('All reports destroyed...'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    seedReports();
}