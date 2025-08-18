const Report = require('../models/Report');
const User = require('../models/User');
const {analyzeReport, moderateContent, findDuplicateReport, parseSearchQuery} = require('../services/openaiService');
const {analyzeImage} = require('../services/googleVisionService');
const cloudinary = require('cloudinary').v2;
const {createNotification} = require('../services/notificationService');

const createReport = async (req, res) => {
    const { description, latitude, longitude } = req.body;

    try {
        if (!description || !latitude || !longitude) {
            return res.status(400).json({ message: "Description and location are required" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "Please upload an image" });
        }

        const lon = parseFloat(longitude);
        const lat = parseFloat(latitude);

        if (isNaN(lon) || isNaN(lat)) {
            return res.status(400).json({ message: 'Invalid latitude or longitude values.' });
        }

        const isFlagged = await moderateContent(description);
        if(isFlagged){
            return res.status(400).json({
                message: 'Your report could not be submitted. The content violates our community guidelines.'
            });
        }

        const MAX_DISTANCE_METERS = 250;
        const nearbyReports = await Report.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [lon, lat] },
                    distanceField: "distance",
                    maxDistance: MAX_DISTANCE_METERS,
                    query: { status: { $in: ['Pending', 'In Progress'] } },
                    spherical: true
                }
            },
            { $project: { _id: 1, description: 1 } }
        ]);

        if (nearbyReports.length > 0) {
            console.log(`Found ${nearbyReports.length} nearby reports, checking for duplicates...`.yellow);
            const duplicateId = await findDuplicateReport(description, nearbyReports);

            if (duplicateId) {
                console.log(`Duplicate found: ${duplicateId}`.red);
                return res.status(409).json({
                    message: 'This issue may have already been reported. We are redirecting you to the existing report.',
                    duplicateReportId: duplicateId
                });
            }
        }

        console.log('Starting parallel AI analysis...'.yellow);
        const textAnalysisPromise = analyzeReport(description);
        const imageAnalysisPromise = analyzeImage(req.file.buffer);

        const [textAnalysis, imageCategory] = await Promise.all([
            textAnalysisPromise,
            imageAnalysisPromise
        ]);

        console.log('OpenAI Text Analysis:', textAnalysis);
        console.log('Google Vision Image Category:', imageCategory);

        const finalCategory = imageCategory || textAnalysis.category;

        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "CivicConnect" },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ message: 'Error uploading image.' });
                }

                const newReport = await Report.create({
                    user: req.user.id,
                    title: textAnalysis.title,
                    description,
                    category: finalCategory,
                    severity: textAnalysis.severity,
                    imageURL: result.secure_url,
                    location: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    }
                });

                res.status(201).json(newReport);
            }
        );
        uploadStream.end(req.file.buffer);
    }
    catch(error){
        console.error(`Error creating report: ${error.message}`.red);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const getAllReports = async (req, res) => {
    try{
        const {category, status, severity, keyword} = req.query;
        const filter = {};

        if (category) {
            filter.category = category;
        }
        if (status) {
            filter.status = status;
        }
        if (severity) {
            filter.severity = severity;
        }

        if(keyword) {
            filter.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        const reports = await Report.find(filter)
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        console.log(`Fetched ${reports.length} reports`.blue);
        console.log(`${reports}`.yellow);

        res.status(200).json({
            success: true,
            count: reports.length,
            reports
        })
    }
    catch(error){
        console.error(`Error fetching reports: ${error.message}`.red);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('user', 'name');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        console.log(`Fetched report by ID: ${report._id}`.blue);
        console.log(`${report}`.yellow);

        res.status(200).json(report);
    } catch (error) {
        console.error(`Error fetching report by ID: ${error.message}`.red);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getUserReports = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user.id }).sort({ createdAt: -1 });

        console.log(`Fetched ${reports.length} user reports`.blue);
        console.log(`${reports}`.yellow);

        res.status(200).json(reports);
    } catch (error) {
        console.error(`Error fetching user reports: ${error.message}`.red);
        res.status(500).json({ message: 'Server Error' });
    }
};

const updateReportStatus = async(req, res) => {
    const {status} = req.body;
    const reportId = req.params.id;

    try{
        if(!status){
            return res.status(400).json({ message: "Status is required" });
        }
        const validStatuses = ['Pending', 'In Progress', 'Resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status;
        await report.save();

        const message = `The status of your report "${report.title}" has been updated to "${status}".`;
        await createNotification(report.user, message, report._id);

        return res.status(200).json({ message: 'Report status updated successfully' });
    }
    catch(error){
        console.error(`Error updating report status: ${error.message}`.red);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const upvoteReport = async (req, res) => {
    try{
        const report = await Report.findById(req.params.id);
        if(!report){
            return res.status(404).json({ message: 'Report not found' });
        }
        const hasUpvoted = report.upvotedBy.includes(req.user.id);
        if(hasUpvoted){
            report.upvotedBy.pull(req.user.id);
            report.upvotes -= 1;
        } else {
            report.upvotedBy.push(req.user.id);
            report.upvotes += 1;
        }
        await report.save();
        console.log(`Report upvoted successfully: ${report._id}`.blue);
        return res.status(200).json({ message: 'Report upvoted successfully', report });
    }
    catch(error){
        console.error(`Error upvoting report: ${error.message}`.red);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const getReportAnalytics = async (req, res) => {
    try {
        const totalReports = await Report.countDocuments();

        const statusCounts = await Report.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const categoryCounts = await Report.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const analytics = {
            totalReports,
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            categoryCounts: categoryCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        };

        res.status(200).json(analytics);

    } catch (error) {
        console.error(`Error fetching analytics: ${error.message}`.red);
        res.status(500).json({ message: 'Server Error' });
    }
};

const nlpSearchReports = async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'A search query "q" is required.' });
    }

    try {
        const aiFilter = await parseSearchQuery(q);
        console.log('AI-parsed filter:', aiFilter);

        const filter = {};
        if (aiFilter.category) filter.category = aiFilter.category;
        if (aiFilter.status) filter.status = aiFilter.status;
        if (aiFilter.severity) filter.severity = aiFilter.severity;

        const stopWords = ['problem', 'problems', 'issue', 'issues', 'report', 'reports'];
        if (aiFilter.keyword && !stopWords.includes(aiFilter.keyword.toLowerCase())) {
            filter.$text = { $search: aiFilter.keyword };
        }
        
        const reports = await Report.find(filter)
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(reports);

    } catch (error) {
        console.error(`Error during NLP search: ${error.message}`.red);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createReport,
    getAllReports,
    getReportById,
    getUserReports,
    updateReportStatus,
    upvoteReport,
    getReportAnalytics,
    nlpSearchReports
};