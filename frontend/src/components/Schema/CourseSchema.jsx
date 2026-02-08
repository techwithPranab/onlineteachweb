import React from 'react';
import PropTypes from 'prop-types';

/**
 * Course Schema Component
 * Educational content schema for individual courses
 */
const CourseSchema = ({ course }) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : "https://meritai.com";
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "MeritAI",
      "url": baseUrl
    },
    "url": `${baseUrl}/course/${course._id || course.id}`,
    "courseCode": course._id || course.id,
    "educationalLevel": `Grade ${course.grade}`,
    "about": course.subject,
    "inLanguage": course.language || "English",
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": course.estimatedHours ? `PT${course.estimatedHours}H` : undefined,
      "instructor": course.createdBy ? {
        "@type": "Person",
        "name": course.createdBy.name || "MeritAI Instructor"
      } : undefined
    },
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "audienceType": `Grade ${course.grade} Students`
    }
  };

  // Add prerequisites if available
  if (course.prerequisites && course.prerequisites.length > 0) {
    schema.coursePrerequisites = course.prerequisites.map(prereq => ({
      "@type": "Course",
      "name": prereq
    }));
  }

  // Add learning outcomes if available
  if (course.learningOutcomes && course.learningOutcomes.length > 0) {
    schema.teaches = course.learningOutcomes;
  }

  // Add syllabus if available
  if (course.syllabus && course.syllabus.length > 0) {
    schema.syllabusSections = course.syllabus.map((section, index) => ({
      "@type": "Syllabus",
      "name": section,
      "position": index + 1
    }));
  }

  // Add rating if available
  if (course.averageRating && course.reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": course.averageRating,
      "reviewCount": course.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  // Add pricing if available
  if (course.price !== undefined) {
    schema.offers = {
      "@type": "Offer",
      "price": course.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/course/${course._id || course.id}`,
      "category": "Educational Course"
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

CourseSchema.propTypes = {
  course: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    grade: PropTypes.number.isRequired,
    subject: PropTypes.string.isRequired,
    language: PropTypes.string,
    estimatedHours: PropTypes.number,
    prerequisites: PropTypes.arrayOf(PropTypes.string),
    learningOutcomes: PropTypes.arrayOf(PropTypes.string),
    syllabus: PropTypes.arrayOf(PropTypes.string),
    averageRating: PropTypes.number,
    reviewCount: PropTypes.number,
    price: PropTypes.number,
    createdBy: PropTypes.shape({
      name: PropTypes.string
    })
  }).isRequired
};

export default CourseSchema;
