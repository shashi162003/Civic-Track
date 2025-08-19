// FILE: controllers/healthController.js (BACKEND)

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to time promises
const timePromise = async (promise) => {
    const startTime = Date.now();
    try {
        const result = await promise;
        const endTime = Date.now();
        return { ...result, responseTime: endTime - startTime };
    } catch (error) {
        const endTime = Date.now();
        return { ...error, responseTime: endTime - startTime };
    }
};

const getHealthStatus = async (req, res) => {
    const services = [
        {
            name: 'Database',
            check: () => timePromise(new Promise(resolve => {
                const isConnected = mongoose.connection.readyState === 1;
                resolve({
                    status: isConnected ? 'OK' : 'Error',
                    message: isConnected ? 'Connected successfully' : 'Not connected'
                });
            }))
        },
        {
            name: 'Cloudinary',
            check: () => timePromise(cloudinary.api.ping().then(() => ({ status: 'OK', message: 'Connected successfully' })).catch(err => ({ status: 'Error', message: err.message })))
        },
        {
            name: 'OpenAI',
            check: () => timePromise(openai.models.list({ limit: 1 }).then(() => ({ status: 'OK', message: 'API key is valid' })).catch(err => ({ status: 'Error', message: err.message })))
        },
        {
            name: 'GoogleVision',
            check: () => timePromise(new Promise(resolve => {
                try {
                    const vision = require('@google-cloud/vision');
                    const path = require('path');
                    new vision.ImageAnnotatorClient({
                        keyFilename: path.join(__dirname, '../config/gcp-credentials.json')
                    });
                    resolve({ status: 'OK', message: 'Client configured' });
                } catch (err) {
                    resolve({ status: 'Error', message: err.message });
                }
            }))
        }
    ];

    const results = await Promise.all(services.map(s => s.check().then(result => ({ name: s.name, ...result }))));
    const overallStatus = results.every(r => r.status === 'OK') ? 'OK' : 'Error';
    const httpStatusCode = overallStatus === 'OK' ? 200 : 503;

    res.status(httpStatusCode).json({
        overallStatus,
        timestamp: new Date().toISOString(),
        services: results
    });
};

module.exports = { getHealthStatus };