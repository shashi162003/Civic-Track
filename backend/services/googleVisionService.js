const vision = require('@google-cloud/vision');
const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);

const client = new vision.ImageAnnotatorClient({
    credentials
});

const analyzeImage = async (buffer) => {
    try {
        const [result] = await client.labelDetection(buffer);
        const labels = result.labelAnnotations.map(label => label.description.toLowerCase());

        console.log('Google Vision AI Labels:', labels);

        if (labels.includes('pothole') || labels.includes('road')) return 'Roads';
        if (labels.includes('trash') || labels.includes('garbage') || labels.includes('waste')) return 'Waste';
        if (labels.includes('street light') || labels.includes('lamp')) return 'Lighting';
        if (labels.includes('water') || labels.includes('leak')) return 'Water';

        return null;
    } catch (error) {
        console.error('Error with Google Vision AI:', error);
        return null;
    }
};

module.exports = { analyzeImage };