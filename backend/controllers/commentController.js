const Comment = require('../models/Comment');
const Report = require('../models/Report');

const addComment = async(req, res) => {
    const {text} = req.body;
    const {reportId} = req.params;
    
    try{
        const report = await Report.findById(reportId);
        if(!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const newComment = await Comment.create({
            text,
            user: req.user.id,
            report: reportId,
        })

        console.log(`New comment added: ${newComment.text}`.green);

        res.status(201).json({ success: true, message: 'Comment added successfully', newComment });
    }
    catch(error){
        console.error(`Error adding comment: ${error.message}`.red);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ report: req.params.reportId })
            .populate('user', 'name')
            .sort({ createdAt: 'desc' });

        console.log(`Fetched ${comments.length} comments for report ${req.params.reportId}`.blue);

        res.status(200).json(comments);
    } catch (error) {
        console.error(`Error fetching comments: ${error.message}`.red);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addComment,
    getComments
}