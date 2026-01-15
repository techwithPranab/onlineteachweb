/**
 * AI Generation Queue Service
 * Handles async processing of large batch AI question generation
 * with progress tracking and retry capability
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class AIGenerationQueue extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.activeJobs = new Map();
    this.completedJobs = new Map();
    this.maxConcurrent = 3;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    this.isProcessing = false;
    this.jobIdCounter = 0;
  }

  /**
   * Add a generation job to the queue
   * @param {Object} jobData - Job configuration
   * @returns {string} - Job ID
   */
  addJob(jobData) {
    const jobId = `gen_${Date.now()}_${++this.jobIdCounter}`;
    
    const job = {
      id: jobId,
      data: jobData,
      status: 'pending',
      progress: 0,
      totalItems: jobData.topics?.length || 1,
      completedItems: 0,
      results: [],
      errors: [],
      retryCount: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null
    };

    this.queue.push(job);
    this.emit('jobAdded', { jobId, job });
    
    logger.info(`AI generation job added: ${jobId}`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return jobId;
  }

  /**
   * Process jobs in the queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeJobs.size < this.maxConcurrent) {
      const job = this.queue.shift();
      this.activeJobs.set(job.id, job);
      
      // Process job asynchronously
      this.processJob(job).catch(error => {
        logger.error(`Error processing job ${job.id}:`, error);
      });
    }

    this.isProcessing = false;
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    job.status = 'processing';
    job.startedAt = new Date();
    
    this.emit('jobStarted', { jobId: job.id, job });
    logger.info(`Started processing job: ${job.id}`);

    try {
      const { courseId, topics, difficulty, count, provider, userId } = job.data;
      
      // Import service dynamically to avoid circular dependency
      const AIQuestionGenerationService = require('../ai/AIQuestionGenerationService');
      const aiService = new AIQuestionGenerationService();

      // Process each topic
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        
        try {
          // Update progress
          job.progress = Math.round((i / topics.length) * 100);
          job.completedItems = i;
          
          this.emit('jobProgress', {
            jobId: job.id,
            progress: job.progress,
            currentTopic: topic,
            completedItems: job.completedItems,
            totalItems: job.totalItems
          });

          // Generate questions for this topic
          const result = await aiService.generateQuestions({
            courseId,
            topics: [topic],
            difficulty,
            count: Math.ceil(count / topics.length),
            provider
          });

          if (result.questions && result.questions.length > 0) {
            job.results.push(...result.questions);
          }

          if (result.errors && result.errors.length > 0) {
            job.errors.push(...result.errors.map(e => ({ topic, error: e })));
          }

        } catch (topicError) {
          logger.error(`Error generating for topic ${topic}:`, topicError);
          job.errors.push({ topic, error: topicError.message });
        }
      }

      // Job completed
      job.status = 'completed';
      job.progress = 100;
      job.completedItems = job.totalItems;
      job.completedAt = new Date();

      this.emit('jobCompleted', {
        jobId: job.id,
        results: job.results,
        errors: job.errors,
        totalGenerated: job.results.length
      });

      logger.info(`Job ${job.id} completed. Generated ${job.results.length} questions.`);

      // Create notification for user
      await this.notifyUser(job);

    } catch (error) {
      logger.error(`Job ${job.id} failed:`, error);
      
      // Retry logic
      if (job.retryCount < this.maxRetries) {
        job.retryCount++;
        job.status = 'retrying';
        
        this.emit('jobRetrying', {
          jobId: job.id,
          attempt: job.retryCount,
          maxRetries: this.maxRetries
        });

        // Add back to queue after delay
        setTimeout(() => {
          this.queue.push(job);
          this.processQueue();
        }, this.retryDelay * job.retryCount);
        
      } else {
        job.status = 'failed';
        job.completedAt = new Date();
        job.errors.push({ error: error.message });
        
        this.emit('jobFailed', {
          jobId: job.id,
          error: error.message,
          errors: job.errors
        });
      }
    } finally {
      // Move to completed jobs
      this.activeJobs.delete(job.id);
      this.completedJobs.set(job.id, job);

      // Cleanup old completed jobs (keep last 100)
      if (this.completedJobs.size > 100) {
        const oldestKey = this.completedJobs.keys().next().value;
        this.completedJobs.delete(oldestKey);
      }

      // Continue processing queue
      this.processQueue();
    }
  }

  /**
   * Notify user when job completes
   */
  async notifyUser(job) {
    try {
      const Notification = require('../models/Notification.model');
      
      if (job.data.userId) {
        const notification = new Notification({
          user: job.data.userId,
          type: 'ai_generation_complete',
          title: 'AI Question Generation Complete',
          message: `Generated ${job.results.length} questions for your course. ${job.errors.length > 0 ? `(${job.errors.length} errors)` : ''}`,
          relatedId: job.data.courseId,
          relatedType: 'Course',
          isRead: false
        });
        await notification.save();
      }
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    // Check active jobs
    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId);
      return {
        found: true,
        ...this.formatJobStatus(job)
      };
    }

    // Check completed jobs
    if (this.completedJobs.has(jobId)) {
      const job = this.completedJobs.get(jobId);
      return {
        found: true,
        ...this.formatJobStatus(job)
      };
    }

    // Check pending jobs in queue
    const queuedJob = this.queue.find(j => j.id === jobId);
    if (queuedJob) {
      return {
        found: true,
        ...this.formatJobStatus(queuedJob)
      };
    }

    return { found: false };
  }

  /**
   * Format job status for API response
   */
  formatJobStatus(job) {
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      totalItems: job.totalItems,
      completedItems: job.completedItems,
      resultsCount: job.results.length,
      errorsCount: job.errors.length,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt
    };
  }

  /**
   * Get job results
   */
  getJobResults(jobId) {
    const job = this.completedJobs.get(jobId) || this.activeJobs.get(jobId);
    
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: job.status,
      results: job.results,
      errors: job.errors,
      totalGenerated: job.results.length
    };
  }

  /**
   * Cancel a pending job
   */
  cancelJob(jobId) {
    const queueIndex = this.queue.findIndex(j => j.id === jobId);
    
    if (queueIndex !== -1) {
      const job = this.queue.splice(queueIndex, 1)[0];
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.completedJobs.set(jobId, job);
      
      this.emit('jobCancelled', { jobId });
      return true;
    }

    return false;
  }

  /**
   * Get queue stats
   */
  getStats() {
    return {
      pending: this.queue.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.size,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Export singleton instance
const aiGenerationQueue = new AIGenerationQueue();
module.exports = aiGenerationQueue;
