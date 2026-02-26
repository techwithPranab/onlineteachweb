const CourseReview = require('../models/CourseReview.model');
const Course = require('../models/Course.model');
const mongoose = require('mongoose');

/**
 * Recalculate and update course rating based on approved reviews
 * @param {String} courseId - Course ID
 * @returns {Object} Updated rating statistics
 */
const recalculateCourseRating = async (courseId) => {
  try {
    // Get review statistics from CourseReview model
    const stats = await CourseReview.getReviewStats(courseId);

    // Update the course with new statistics
    await Course.findByIdAndUpdate(
      courseId,
      {
        averageRating: stats.averageRating,
        totalRatings: stats.totalRatings,
        reviewCount: stats.reviewCount
      },
      { new: true }
    );

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error recalculating course rating:', error);
    throw new Error('Failed to recalculate course rating');
  }
};

/**
 * Check if student is enrolled in the course
 * @param {String} studentId - Student user ID
 * @param {String} courseId - Course ID
 * @returns {Boolean} - Whether student is enrolled
 */
const isStudentEnrolled = async (studentId, courseId) => {
  // TODO: Implement based on your enrollment model
  // For now, returning true - you should implement actual enrollment check
  // Example: Check Subscription model or Enrollment model
  return true;
};

/**
 * Get paginated reviews for a course
 * @param {String} courseId - Course ID
 * @param {Object} options - Pagination and filter options
 * @returns {Object} Paginated reviews
 */
const getCourseReviewsPaginated = async (courseId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    status = 'approved'
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // If sorting by featured, add secondary sort
  if (sortBy === 'isFeatured') {
    sort.createdAt = -1;
  }

  const query = { course: courseId };
  if (status) {
    query.status = status;
  }

  const [reviews, total] = await Promise.all([
    CourseReview.find(query)
      .populate('student', 'name email profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseReview.countDocuments(query)
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get featured reviews across all courses
 * @param {Number} limit - Maximum number of featured reviews
 * @returns {Array} Featured reviews
 */
const getFeaturedReviews = async (limit = 10) => {
  const reviews = await CourseReview.find({
    status: 'approved',
    isFeatured: true
  })
    .populate('student', 'name email profilePicture')
    .populate('course', 'title thumbnail grade subject')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return reviews;
};

/**
 * Get pending reviews count for admin dashboard
 * @returns {Number} Count of pending reviews
 */
const getPendingReviewsCount = async () => {
  return await CourseReview.countDocuments({ status: 'pending' });
};

/**
 * Validate review data
 * @param {Object} reviewData - Review data to validate
 * @returns {Object} Validation result
 */
const validateReviewData = (reviewData) => {
  const errors = [];

  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (!reviewData.reviewText || reviewData.reviewText.trim().length < 10) {
    errors.push('Review text must be at least 10 characters');
  }

  if (reviewData.reviewText && reviewData.reviewText.length > 1000) {
    errors.push('Review text cannot exceed 1000 characters');
  }

  if (reviewData.reviewTitle && reviewData.reviewTitle.length > 100) {
    errors.push('Review title cannot exceed 100 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  recalculateCourseRating,
  isStudentEnrolled,
  getCourseReviewsPaginated,
  getFeaturedReviews,
  getPendingReviewsCount,
  validateReviewData
};
