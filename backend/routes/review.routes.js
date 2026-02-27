const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================

// Get approved reviews for a course
router.get('/course/:courseId', reviewController.getCourseReviews);

// Get featured reviews
router.get('/featured', reviewController.getFeaturedReviews);

// Get recent approved reviews across all courses (public, used for homepage)
router.get('/approved/recent', reviewController.getRecentApprovedReviews);

// ==================== STUDENT ROUTES (AUTHENTICATED) ====================

// Submit or update a review
router.post('/', authenticate, reviewController.submitReview);

// Get student's own review for a course
router.get('/my-review/:courseId', authenticate, reviewController.getMyReview);

// Update student's own review
router.put('/:reviewId', authenticate, reviewController.updateMyReview);

// Delete student's own review
router.delete('/:reviewId', authenticate, reviewController.deleteMyReview);

// ==================== ADMIN ROUTES ====================

// Get review statistics
router.get('/admin/stats', authenticate, authorize('admin'), reviewController.getReviewStats);

// Get all pending reviews
router.get('/admin/pending', authenticate, authorize('admin'), reviewController.getAllPendingReviews);

// Get all reviews with filters
router.get('/admin/all', authenticate, authorize('admin'), reviewController.getAllReviews);

// Approve a review
router.put('/admin/:reviewId/approve', authenticate, authorize('admin'), reviewController.approveReview);

// Reject a review
router.put('/admin/:reviewId/reject', authenticate, authorize('admin'), reviewController.rejectReview);

// Toggle featured status
router.put('/admin/:reviewId/toggle-featured', authenticate, authorize('admin'), reviewController.toggleFeaturedReview);

module.exports = router;
