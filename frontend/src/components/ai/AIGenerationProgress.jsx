import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import aiQuestionService from '@/services/aiQuestionService';

/**
 * AI Generation Progress Component
 * Shows real-time progress for async AI question generation
 */
export default function AIGenerationProgress({ 
  jobId, 
  onComplete, 
  onError,
  showDetails = true,
  className = ''
}) {
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // Poll for job status
  const { data: jobStatus, error, refetch } = useQuery(
    ['aiGenerationJob', jobId],
    () => aiQuestionService.getJobStatus(jobId),
    {
      enabled: !!jobId && pollingEnabled,
      refetchInterval: (data) => {
        // Stop polling when job is completed/failed
        if (data?.job?.status === 'completed' || data?.job?.status === 'failed') {
          return false;
        }
        return 2000; // Poll every 2 seconds
      },
      onSuccess: (data) => {
        if (data?.job?.status === 'completed') {
          setPollingEnabled(false);
          onComplete?.(data.job);
        } else if (data?.job?.status === 'failed') {
          setPollingEnabled(false);
          onError?.(data.job);
        }
      },
      onError: (err) => {
        setPollingEnabled(false);
        onError?.(err);
      }
    }
  );

  const job = jobStatus?.job;

  const getStatusIcon = () => {
    if (!job) return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    
    switch (job.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'retrying':
        return <RefreshCw className="w-5 h-5 animate-spin text-yellow-500" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!job) return 'Loading...';
    
    switch (job.status) {
      case 'pending':
        return 'Waiting in queue...';
      case 'processing':
        return `Generating questions... (${job.progress}%)`;
      case 'completed':
        return `Completed! Generated ${job.resultsCount} questions`;
      case 'failed':
        return 'Generation failed';
      case 'retrying':
        return 'Retrying...';
      default:
        return job.status;
    }
  };

  const getStatusColor = () => {
    if (!job) return 'bg-gray-100';
    
    switch (job.status) {
      case 'pending':
        return 'bg-gray-100';
      case 'processing':
        return 'bg-primary-100';
      case 'completed':
        return 'bg-green-100';
      case 'failed':
        return 'bg-red-100';
      case 'retrying':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Error checking job status</p>
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 ${getStatusColor()} p-4 ${className}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="font-medium text-gray-900">{getStatusText()}</p>
          {job && showDetails && (
            <p className="text-sm text-gray-600 mt-0.5">
              {job.completedItems} of {job.totalItems} topics processed
            </p>
          )}
        </div>
        
        {job?.status === 'processing' && (
          <div className="text-right">
            <span className="text-2xl font-bold text-primary-600">
              {job.progress}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {job && (job.status === 'processing' || job.status === 'completed') && (
        <div className="mt-3">
          <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                job.status === 'completed' ? 'bg-green-500' : 'bg-primary-600'
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error details */}
      {job?.status === 'failed' && job.errorsCount > 0 && (
        <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 inline-block mr-1" />
          {job.errorsCount} errors occurred during generation
        </div>
      )}

      {/* Completed actions */}
      {job?.status === 'completed' && (
        <div className="mt-3 flex gap-2">
          <a
            href="/tutor/ai-questions/review"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Review Generated Questions
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Compact progress indicator for dashboard
 */
export function AIGenerationProgressCompact({ jobId, className = '' }) {
  const { data: jobStatus } = useQuery(
    ['aiGenerationJob', jobId],
    () => aiQuestionService.getJobStatus(jobId),
    {
      enabled: !!jobId,
      refetchInterval: (data) => {
        if (data?.job?.status === 'completed' || data?.job?.status === 'failed') {
          return false;
        }
        return 3000;
      }
    }
  );

  const job = jobStatus?.job;
  
  if (!job) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {job.status === 'processing' && (
        <>
          <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
          <span className="text-sm text-primary-600 font-medium">
            Generating... {job.progress}%
          </span>
        </>
      )}
      {job.status === 'completed' && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">
            {job.resultsCount} questions ready
          </span>
        </>
      )}
      {job.status === 'pending' && (
        <>
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Queued
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Hook for managing async generation
 */
export function useAsyncGeneration() {
  const [activeJobId, setActiveJobId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const startGeneration = useCallback(async (generationParams) => {
    setIsGenerating(true);
    try {
      const result = await aiQuestionService.generateQuestionsAsync(generationParams);
      setActiveJobId(result.jobId);
      return result;
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  }, []);

  const handleComplete = useCallback((job) => {
    setIsGenerating(false);
    // Keep jobId for showing results
  }, []);

  const handleError = useCallback((error) => {
    setIsGenerating(false);
  }, []);

  const reset = useCallback(() => {
    setActiveJobId(null);
    setIsGenerating(false);
  }, []);

  return {
    activeJobId,
    isGenerating,
    startGeneration,
    handleComplete,
    handleError,
    reset
  };
}
