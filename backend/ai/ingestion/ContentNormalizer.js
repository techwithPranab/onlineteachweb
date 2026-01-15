const logger = require('../../utils/logger');

/**
 * Content Normalizer
 * Normalizes content from various sources into clean text for AI processing
 */
class ContentNormalizer {
  constructor() {
    // Maximum content length for AI processing (tokens ≈ words * 1.3)
    this.maxContentLength = 8000;
    
    // Section separators
    this.sectionSeparator = '\n\n---\n\n';
  }

  /**
   * Normalize content from course syllabus
   */
  normalizeSyllabus(course) {
    const sections = [];
    
    // Course title and description
    sections.push(`# ${course.title}`);
    sections.push(course.description);
    
    // Syllabus points
    if (course.syllabus && course.syllabus.length > 0) {
      sections.push('## Syllabus');
      sections.push(course.syllabus.map(s => `- ${s}`).join('\n'));
    }
    
    // Topics
    if (course.topics && course.topics.length > 0) {
      sections.push('## Topics');
      sections.push(course.topics.map(t => `- ${t}`).join('\n'));
    }
    
    // Chapters with topics
    if (course.chapters && course.chapters.length > 0) {
      sections.push('## Chapters');
      for (const chapter of course.chapters) {
        sections.push(`### ${chapter.name}`);
        if (chapter.topics && chapter.topics.length > 0) {
          sections.push(chapter.topics.map(t => `- ${t}`).join('\n'));
        }
        if (chapter.learningObjectives && chapter.learningObjectives.length > 0) {
          sections.push('**Learning Objectives:**');
          sections.push(chapter.learningObjectives.map(lo => `- ${lo}`).join('\n'));
        }
      }
    }
    
    return {
      content: sections.join(this.sectionSeparator),
      sourceType: 'syllabus',
      topics: this._extractTopics(course)
    };
  }

  /**
   * Normalize content from materials
   */
  normalizeMaterial(material, textContent) {
    const sections = [];
    
    sections.push(`# ${material.title}`);
    
    if (material.description) {
      sections.push(material.description);
    }
    
    if (textContent) {
      sections.push('## Content');
      sections.push(this._cleanText(textContent));
    }
    
    return {
      content: this._truncate(sections.join(this.sectionSeparator)),
      sourceType: 'material',
      materialId: material._id,
      materialType: material.type
    };
  }

  /**
   * Normalize topic summary
   */
  normalizeTopicSummary(topicName, summaryText, learningObjectives = []) {
    const sections = [];
    
    sections.push(`# Topic: ${topicName}`);
    
    if (learningObjectives.length > 0) {
      sections.push('## Learning Objectives');
      sections.push(learningObjectives.map(lo => `- ${lo}`).join('\n'));
    }
    
    if (summaryText) {
      sections.push('## Summary');
      sections.push(this._cleanText(summaryText));
    }
    
    return {
      content: this._truncate(sections.join(this.sectionSeparator)),
      sourceType: 'topic_summary',
      topic: topicName
    };
  }

  /**
   * Combine multiple content sources
   */
  combineContent(sources) {
    const combined = [];
    let totalLength = 0;
    
    for (const source of sources) {
      if (!source.content) continue;
      
      // Check if adding this would exceed limit
      if (totalLength + source.content.length > this.maxContentLength) {
        // Truncate this source to fit
        const remaining = this.maxContentLength - totalLength;
        if (remaining > 100) {
          combined.push({
            ...source,
            content: source.content.substring(0, remaining) + '...'
          });
        }
        break;
      }
      
      combined.push(source);
      totalLength += source.content.length;
    }
    
    return {
      combinedContent: combined.map(s => s.content).join(this.sectionSeparator),
      sources: combined.map(s => ({
        type: s.sourceType,
        id: s.materialId || s.topic
      })),
      totalLength
    };
  }

  /**
   * Extract topics from course
   */
  _extractTopics(course) {
    const topics = new Set();
    
    // Direct topics
    if (course.topics) {
      course.topics.forEach(t => topics.add(t));
    }
    
    // Chapter topics
    if (course.chapters) {
      for (const chapter of course.chapters) {
        topics.add(chapter.name);
        if (chapter.topics) {
          chapter.topics.forEach(t => topics.add(t));
        }
      }
    }
    
    return Array.from(topics);
  }

  /**
   * Clean text content
   */
  _cleanText(text) {
    if (!text) return '';
    
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that might confuse AI
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Truncate content to max length
   */
  _truncate(text) {
    if (text.length <= this.maxContentLength) return text;
    
    // Try to truncate at a sentence boundary
    const truncated = text.substring(0, this.maxContentLength);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > this.maxContentLength * 0.8) {
      return truncated.substring(0, lastPeriod + 1);
    }
    
    return truncated + '...';
  }

  /**
   * Set max content length
   */
  setMaxContentLength(length) {
    this.maxContentLength = length;
  }
}

module.exports = new ContentNormalizer();
