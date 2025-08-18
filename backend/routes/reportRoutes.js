const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { createReport, getAllReports, getUserReports, getReportById, updateReportStatus, upvoteReport, getReportAnalytics, nlpSearchReports } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');
const commentRouter = require('./commentRoutes')
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', protect, upload.single('image'), createReport);
router.get('/', getAllReports);
router.get('/myreports', protect, getUserReports);
router.get('/search', nlpSearchReports);
router.get('/analytics', protect, authorize('Authority', 'Admin'), getReportAnalytics);
router.get('/:id', getReportById);
router.put('/:id/status', protect, authorize('Authority', 'Admin'), updateReportStatus);
router.post('/:id/upvote', protect, upvoteReport);
router.use('/:reportId/comments', commentRouter);

module.exports = router;