const mongoose = require('mongoose');

const courseReviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviewTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  reviewText: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per student per course
courseReviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Index for filtering featured approved reviews
courseReviewSchema.index({ isFeatured: 1, status: 1 });

// Index for admin filtering
courseReviewSchema.index({ status: 1, createdAt: -1 });

// Virtual to populate student details
courseReviewSchema.virtual('studentDetails', {
  ref: 'User',
  localField: 'student',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate course details
courseReviewSchema.virtual('courseDetails', {
  ref: 'Course',
  localField: 'course',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON
courseReviewSchema.set('toJSON', { virtuals: true });
courseReviewSchema.set('toObject', { virtuals: true });

// Pre-save hook to validate that only approved reviews can be featured
courseReviewSchema.pre('save', function(next) {
  if (this.isFeatured && this.status !== 'approved') {
    this.isFeatured = false;
  }
  next();
});

// Static method to get review statistics for a course
courseReviewSchema.statics.getReviewStats = async function(courseId) {
  const stats = await this.aggregate([
    {
      $match: {
        course: mongoose.Types.ObjectId(courseId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      reviewCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  stats[0].ratingDistribution.forEach(rating => {
    distribution[rating]++;
  });

  return {
    averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
    totalRatings: stats[0].totalRatings,
    reviewCount: stats[0].totalRatings,
    ratingDistribution: distribution
  };
};

module.exports = mongoose.model('CourseReview', courseReviewSchema);
