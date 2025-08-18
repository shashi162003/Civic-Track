const Report = require('../models/Report');
const User = require('../models/User');
const {analyzeReport} = require('../services/openaiService');

const createReport = async (req, res) => {
    const { description, latitude, longitude } = req.body;

    try {
        if (!description || !latitude || !longitude) {
            return res.status(400).json({ message: "Description and location are required" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "Please upload an image" });
        }

        console.log('Sending description to AI for analysis...'.yellow);
        const aiData = await analyzeReport(description);
        console.log('AI analysis complete:'.green, aiData);

        const newReport = await Report.create({
            user: req.user.id,
            title: aiData.title,
            description,
            category: aiData.category,
            severity: aiData.severity,
            imageURL: req.file.path,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        })

        console.log(`Report created successfully: ${newReport._id}`.blue);

        return res.status(201).json({
            success: true,
            message: "Report created successfully",
            newReport
        });
    }
    catch(error){
        console.error(`Error creating report: ${error.message}`.red);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({}).populate('user', 'name').sort({ createdAt: -1 });
        console.log(`Fetched ${reports.length} reports`.blue);
        console.log(`${reports}`.yellow);
        res.status(200).json(reports);
    } catch (error) {
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

module.exports = {
    createReport,
    getAllReports,
    getReportById,
    getUserReports,
    updateReportStatus,
    upvoteReport
};