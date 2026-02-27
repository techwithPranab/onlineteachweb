const CourseReview = require('../models/CourseReview.model');
const Course = require('../models/Course.model');
const reviewService = require('../services/review.service');

// ==================== STUDENT FUNCTIONS ====================

/**
 * Submit a new review or update existing review
 * POST /api/reviews
 */
exports.submitReview = async (req, res) => {
  try {
    const { courseId, rating, reviewTitle, reviewText } = req.body;
    const studentId = req.user._id;

    // Validate required fields
    if (!courseId || !rating || !reviewText) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, rating, and review text are required'
      });
    }

    // Validate review data
    const validation = reviewService.validateReviewData({ rating, reviewTitle, reviewText });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student is enrolled (optional - uncomment if needed)
    // const isEnrolled = await reviewService.isStudentEnrolled(studentId, courseId);
    // if (!isEnrolled) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You must be enrolled in this course to leave a review'
    //   });
    // }

    // Check if review already exists
    let review = await CourseReview.findOne({ course: courseId, student: studentId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.reviewTitle = reviewTitle || review.reviewTitle;
      review.reviewText = reviewText;
      review.status = 'pending'; // Reset to pending for re-approval
      review.isFeatured = false; // Remove featured status when edited
      await review.save();

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully and sent for approval',
        review
      });
    } else {
      // Create new review
      review = await CourseReview.create({
        course: courseId,
        student: studentId,
        rating,
        reviewTitle,
        reviewText,
        status: 'pending'
      });

      return res.status(201).json({
        success: true,
        message: 'Review submitted successfully and is pending approval',
        review
      });
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this course'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

/**
 * Get student's own review for a specific course
 * GET /api/reviews/my-review/:courseId
 */
exports.getMyReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    const review = await CourseReview.findOne({
      course: courseId,
      student: studentId
    }).populate('course', 'title thumbnail');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review',
      error: error.message
    });
  }
};

/**
 * Update student's own review
 * PUT /api/reviews/:reviewId
 */
exports.updateMyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, reviewTitle, reviewText } = req.body;
    const studentId = req.user._id;

    // Validate review data
    const validation = reviewService.validateReviewData({ rating, reviewTitle, reviewText });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const review = await CourseReview.findOne({
      _id: reviewId,
      student: studentId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }

    // Update review
    review.rating = rating;
    review.reviewTitle = reviewTitle;
    review.reviewText = reviewText;
    review.status = 'pending'; // Reset to pending for re-approval
    review.isFeatured = false; // Remove featured status when edited
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully and sent for approval',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

/**
 * Delete student's own review
 * DELETE /api/reviews/:reviewId
 */
exports.deleteMyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const studentId = req.user._id;

    const review = await CourseReview.findOne({
      _id: reviewId,
      student: studentId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    const courseId = review.course;

    // Delete the review
    await CourseReview.findByIdAndDelete(reviewId);

    // Recalculate course rating
    await reviewService.recalculateCourseRating(courseId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// ==================== PUBLIC FUNCTIONS ====================

/**
 * Get approved reviews for a course
 * GET /api/reviews/course/:courseId
 */
exports.getCourseReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await reviewService.getCourseReviewsPaginated(courseId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course reviews',
      error: error.message
    });
  }
};

/**
 * Get featured reviews across all courses
 * GET /api/reviews/featured
 */
exports.getFeaturedReviews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const reviews = await reviewService.getFeaturedReviews(parseInt(limit));

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching featured reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured reviews',
      error: error.message
    });
  }
};

/**
 * Get recent approved reviews across all courses (public — homepage fallback)
 * GET /api/reviews/approved/recent
 */
exports.getRecentApprovedReviews = async (req, res) => {
  try {
    const { limit = 3 } = req.query;
    const reviews = await CourseReview.find({ status: 'approved' })
      .populate('student', 'name email profilePicture')
      .populate('course', 'title thumbnail grade subject')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Error fetching recent approved reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent approved reviews',
      error: error.message
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all pending reviews (Admin)
 * GET /api/admin/reviews/pending
 */
exports.getAllPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      CourseReview.find({ status: 'pending' })
        .populate('student', 'name email profilePicture')
        .populate('course', 'title thumbnail grade subject')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CourseReview.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reviews',
      error: error.message
    });
  }
};

/**
 * Get all reviews with filters (Admin)
 * GET /api/admin/reviews
 */
exports.getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      courseId,
      studentId,
      isFeatured
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (status) query.status = status;
    if (courseId) query.course = courseId;
    if (studentId) query.student = studentId;
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    const [reviews, total] = await Promise.all([
      CourseReview.find(query)
        .populate('student', 'name email profilePicture')
        .populate('course', 'title thumbnail grade subject')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CourseReview.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

/**
 * Approve a review (Admin)
 * PUT /api/admin/reviews/:reviewId/approve
 */
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const adminId = req.user._id;

    const review = await CourseReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = 'approved';
    review.approvedBy = adminId;
    review.approvedAt = new Date();
    await review.save();

    // Recalculate course rating
    await reviewService.recalculateCourseRating(review.course);

    res.status(200).json({
      success: true,
      message: 'Review approved successfully',
      review
    });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message
    });
  }
};

/**
 * Reject a review (Admin)
 * PUT /api/admin/reviews/:reviewId/reject
 */
exports.rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    const review = await CourseReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const wasApproved = review.status === 'approved';

    review.status = 'rejected';
    review.adminNotes = adminNotes || 'Review did not meet community guidelines';
    review.approvedBy = adminId;
    review.rejectedAt = new Date();
    review.isFeatured = false;
    await review.save();

    // Recalculate course rating if review was previously approved
    if (wasApproved) {
      await reviewService.recalculateCourseRating(review.course);
    }

    res.status(200).json({
      success: true,
      message: 'Review rejected successfully',
      review
    });
  } catch (error) {
    console.error('Error rejecting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject review',
      error: error.message
    });
  }
};

/**
 * Toggle featured status of a review (Admin)
 * PUT /api/admin/reviews/:reviewId/toggle-featured
 */
exports.toggleFeaturedReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await CourseReview.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved reviews can be featured'
      });
    }

    review.isFeatured = !review.isFeatured;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${review.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      review
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured status',
      error: error.message
    });
  }
};

/**
 * Get review statistics (Admin Dashboard)
 * GET /api/admin/reviews/stats
 */
exports.getReviewStats = async (req, res) => {
  try {
    const [pending, approved, rejected, featured] = await Promise.all([
      CourseReview.countDocuments({ status: 'pending' }),
      CourseReview.countDocuments({ status: 'approved' }),
      CourseReview.countDocuments({ status: 'rejected' }),
      CourseReview.countDocuments({ status: 'approved', isFeatured: true })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        featured,
        total: pending + approved + rejected
      }
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
};
