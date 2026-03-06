import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { quizService, quizEvaluationService, algorithmQuizService } from '../../services/apiServices'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SEOHead from '../../components/SEO/SEOHead';
import ErrorMessage from '../../components/common/ErrorMessage'
import {
  calculateQuizScore,
  analyzeByTopic,
  analyzeByDifficulty,
  analyzeTimeManagement,
  identifyImprovementAreas,
  generateNextActions,
  storeQuizAttempt,
  checkAnswer
} from '../../utils/quiz'

// Import tab components
import OverviewTab from './QuizResults/OverviewTab'
import DetailedTab from './QuizResults/DetailedTab'
import AnalysisTab from './QuizResults/AnalysisTab'
import SuggestionsTab from './QuizResults/SuggestionsTab'

export default function QuizResults() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  
  // Version check - if you see this log, the latest code is loaded
  console.log('🆕 QuizResults component loaded - VERSION: 2.0 with triple fallback')
  console.log('🔧 CODE VERSION CHECK: If you see this message, new code is active!')
  
  // Force a visible indicator that new code is loaded
  if (typeof window !== 'undefined') {
    window.QUIZ_RESULTS_VERSION = '2.0-TRIPLE-FALLBACK'
    console.log('✅ Set window.QUIZ_RESULTS_VERSION =', window.QUIZ_RESULTS_VERSION)
  }
  
  console.log('🎯 QuizResults component mounted:', {
    urlParams: useParams(),
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    quizIdFromParams: quizId,
    fullLocation: location
  });
  
  const [result, setResult] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Check if coming from submission
  const submissionResult = location.state?.result
  const isAutoSubmit = location.state?.isAutoSubmit
  const quizData = location.state?.quiz
  const newBadges = location.state?.newBadges || []

  useEffect(() => {
    console.log('🔍 QuizResults useEffect triggered:', {
      quizId,
      hasSubmissionResult: !!submissionResult,
      hasQuizData: !!quizData,
      locationState: location.state,
      fromHistory: location.state?.fromHistory,
      hasLocationState: !!location.state
    });
    
    // ✅ PRIORITY 1: Check if coming from history FIRST
    if (location.state?.fromHistory) {
      // Fetch data from history (QuizSession)
      console.log('Fetching results from history due to location state');
      fetchResultsFromHistory()
    } else if (submissionResult && quizData) {
      // If we have algorithm quiz results in location state, use them directly
      handleAlgorithmQuizResults()
    } else {
      // Otherwise fetch from API (for regular quizzes)
      fetchResults()
    }
    fetchAnalytics()
  }, [quizId, submissionResult])

  const handleAlgorithmQuizResults = () => {
    try {
      setLoading(true)
      
      // Get answers from QuizAttempt page navigation state
      const answersObject = {}
      if (submissionResult.overallAnalysis?.answersObject) {
        Object.assign(answersObject, submissionResult.overallAnalysis.answersObject)
      }
      
      // Transform algorithm quiz results to match expected format
      const transformedResult = {
        quiz: {
          _id: quizData.quizId || quizData._id,
          title: `${quizData.subject} - ${quizData.courseName}`,
          subject: quizData.subject,
          difficulty: quizData.difficulty,
          passingPercentage: 60,
          duration: quizData.duration
        },
        session: {
          _id: quizData.quizId,
          score: submissionResult.score || 0,
          totalMarks: submissionResult.totalMarks || 0,
          percentage: submissionResult.percentage || 0,
          passed: submissionResult.passed || false,
          timeSpent: submissionResult.timeTaken || submissionResult.totalTime || 0,
          completedAt: new Date().toISOString(),
          pendingManualEvaluation: false,
          attemptNumber: 1
        },
        evaluation: {
          overallAnalysis: submissionResult.overallAnalysis || {
            totalQuestions: submissionResult.totalQuestions || 0,
            correct: submissionResult.overallAnalysis?.correct || 0,
            wrong: submissionResult.overallAnalysis?.wrong || 0,
            unattempted: submissionResult.overallAnalysis?.unattempted || 0,
            accuracy: submissionResult.accuracy || 0
          },
          topicAnalysis: submissionResult.topicAnalysis || [],
          difficultyAnalysis: submissionResult.difficultyAnalysis || {},
          timeAnalysis: submissionResult.timeAnalysis || {}
        },
        detailedAnswers: quizData.questions?.map((q, index) => {
          const userAnswer = answersObject[index.toString()] || answersObject[q.id] || null
          const isCorrect = checkAnswer(q, userAnswer)
          
          return {
            questionId: q.id,
            questionText: q.question,
            type: q.type,
            options: q.options,
            correctAnswer: getCorrectAnswerDisplay(q),
            yourAnswer: userAnswer,
            isCorrect: isCorrect,
            marks: q.marks || 1,
            scoredMarks: isCorrect ? (q.marks || 1) : 0,
            topic: q.topic,
            difficulty: q.difficulty,
            explanation: q.explanation || ''
          }
        }) || []
      }
      
      setResult(transformedResult)
      setLoading(false)
    } catch (err) {
      console.error('Error handling algorithm quiz results:', err)
      setError('Failed to process quiz results')
      setLoading(false)
    }
  }

  const getCorrectAnswerDisplay = (question) => {
    if (!question) return 'N/A'
    
    switch (question.type) {
      case 'mcq-single':
      case 'mcq':
      case 'true-false':
        // Find the option that matches the correct answer text
        const correctOption = question.options?.find(opt => opt.text === question.correctAnswer)
        // Return the text if found, otherwise return the stored correct answer
        return correctOption ? correctOption.text : question.correctAnswer
      
      case 'mcq-multiple':
      case 'multiple-select':
        // Handle multiple correct answers (comma-separated text)
        if (typeof question.correctAnswer === 'string') {
          const correctAnswerTexts = question.correctAnswer.split(',').map(text => text.trim())
          return correctAnswerTexts.join(', ')
        }
        return question.correctAnswer
      
      case 'numerical':
        return question.correctAnswer
      
      case 'short-answer':
      case 'long-answer':
        return question.expectedAnswer || question.correctAnswer
      
      default:
        return question.correctAnswer
    }
  }

  /**
   * Get user answer display text (convert IDs to readable text)
   */
  const getUserAnswerDisplay = (question, userAnswer) => {
    if (!userAnswer || userAnswer === '') return 'Not Answered'
    
    switch (question.type) {
      case 'mcq-single':
      case 'mcq':
      case 'true-false':
        // Find the option that matches the user's answer ID
        const selectedOption = question.options?.find(opt => 
          String(opt.id) === String(userAnswer) || 
          String(opt._id) === String(userAnswer) ||
          String(opt.value) === String(userAnswer)
        )
        return selectedOption ? selectedOption.text : userAnswer
      
      case 'mcq-multiple':
      case 'multiple-select':
        if (!Array.isArray(userAnswer)) return userAnswer
        
        // Find all options that match the user's answer IDs
        const selectedOptions = question.options?.filter(opt => 
          userAnswer.some(ans => 
            String(opt.id) === String(ans) || 
            String(opt._id) === String(ans) ||
            String(opt.value) === String(ans)
          )
        )
        
        return selectedOptions && selectedOptions.length > 0
          ? selectedOptions.map(opt => opt.text).join(', ')
          : Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer
      
      case 'numerical':
      case 'short-answer':
      case 'long-answer':
        return userAnswer
      
      default:
        return userAnswer
    }
  }

  // Enhanced analysis using quiz utilities
  const enhancedAnalysis = useMemo(() => {
    console.log('🔬 Enhanced Analysis Starting:', {
      hasResult: !!result,
      hasSession: !!result?.session,
      hasQuiz: !!result?.quiz,
      hasDetailedAnswers: !!result?.detailedAnswers,
      detailedAnswersLength: result?.detailedAnswers?.length
    });

    if (!result || !result.session || !result.quiz) return null

    try {
      const { session, quiz, detailedAnswers } = result
      
      // Prepare questions and answers for analysis
      const questions = detailedAnswers || []
      
      console.log('🔬 Questions array for analysis:', {
        questionsLength: questions.length,
        firstQuestion: questions[0],
        questionsSample: questions.slice(0, 2)
      });
      
      // ✅ PHASE 2: Check for empty questions
      if (questions.length === 0) {
        console.warn('No questions available for analysis')
        return {
          scoreAnalysis: { totalQuestions: 0, correct: 0, wrong: 0, percentage: 0 },
          topicAnalysis: [],
          difficultyAnalysis: { easy: { total: 0, correct: 0 }, medium: {}, hard: {}, olympiad: {} },
          timeAnalysis: {},
          improvementAreas: [],
          nextActions: []
        }
      }
      
      // ✅ Build answers map with BOTH questionId and index
      const answers = {}
      questions.forEach((q, index) => {
        answers[q.questionId] = q.yourAnswer           // For questionId lookup
        answers[index.toString()] = q.yourAnswer       // For index lookup
      })
      
      console.log('Enhanced Analysis Input:', {
        questionsCount: questions.length,
        answersCount: Object.keys(answers).length,
        sampleQuestion: questions[0],
        hasEvaluation: !!result.evaluation
      })

      // Calculate comprehensive score
      const scoreAnalysis = calculateQuizScore(questions, answers, result.evaluation)
      
      // ✅ PRIORITY: Use pre-calculated analysis from backend if available
      let topicAnalysis, difficultyAnalysis;
      
      console.log('🔍 Checking for pre-calculated analysis:', {
        hasEvaluation: !!result.evaluation,
        hasTopicAnalysis: !!result.evaluation?.topicAnalysis,
        topicAnalysisLength: result.evaluation?.topicAnalysis?.length || 0,
        hasDifficultyAnalysis: !!result.evaluation?.difficultyAnalysis,
        difficultyAnalysisKeys: Object.keys(result.evaluation?.difficultyAnalysis || {}),
        difficultyAnalysisLength: result.evaluation?.difficultyAnalysis ? Object.keys(result.evaluation.difficultyAnalysis).length : 0,
        topicAnalysisData: result.evaluation?.topicAnalysis,
        difficultyAnalysisData: result.evaluation?.difficultyAnalysis
      });
      
      if (result.evaluation?.topicAnalysis && Array.isArray(result.evaluation.topicAnalysis) && result.evaluation.topicAnalysis.length > 0) {
        // Use pre-calculated topic analysis from backend
        topicAnalysis = result.evaluation.topicAnalysis;
        console.log('✅ Using pre-calculated topic analysis from backend:', topicAnalysis.length, 'topics', topicAnalysis);
      } else {
        // Calculate topic analysis from questions
        console.log('⚠️ No backend topic analysis, calculating from questions');
        topicAnalysis = analyzeByTopic(questions, answers);
        console.log('📊 Calculated topic analysis:', topicAnalysis);
      }
      
      if (result.evaluation?.difficultyAnalysis && Object.keys(result.evaluation.difficultyAnalysis).length > 0) {
        // Use pre-calculated difficulty analysis from backend
        difficultyAnalysis = result.evaluation.difficultyAnalysis;
        console.log('✅ Using pre-calculated difficulty analysis from backend:', difficultyAnalysis);
      } else {
        // Calculate difficulty analysis from questions
        console.log('⚠️ No backend difficulty analysis, calculating from questions');
        difficultyAnalysis = analyzeByDifficulty(questions, answers);
        console.log('📊 Calculated difficulty analysis:', difficultyAnalysis);
      }
      
      // ✅ PHASE 2 FIX: Build timeSpentPerQuestion object from answers
      const timeSpentPerQuestion = {}
      if (Array.isArray(detailedAnswers)) {
        detailedAnswers.forEach((ans, index) => {
          // Use answer's timeSpent if available, otherwise distribute total time evenly
          timeSpentPerQuestion[index.toString()] = ans.timeSpent || 
            (session.timeSpent / detailedAnswers.length) || 0
        })
      }
      
      // Analyze time management with proper data structure
      const timeAnalysis = analyzeTimeManagement(
        questions,
        timeSpentPerQuestion,
        (quiz.duration || 30) * 60
      )
      
      // Identify improvement areas
      const improvementAreas = identifyImprovementAreas(
        scoreAnalysis,
        topicAnalysis,
        difficultyAnalysis,
        timeAnalysis
      )
      
      // Generate next action suggestions
      const nextActions = generateNextActions(improvementAreas, scoreAnalysis)
      
      console.log('Enhanced Analysis Output:', {
        scoreAnalysis,
        topicsCount: topicAnalysis.length,
        difficultyLevels: Object.keys(difficultyAnalysis).length,
        difficultyAnalysisKeys: Object.keys(difficultyAnalysis),
        difficultyAnalysisData: JSON.stringify(difficultyAnalysis).substring(0, 500),
        timeAnalysis
      })
      
      // Store attempt in quiz history
      storeQuizAttempt({
        id: session._id,
        sessionId: session._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        subject: quiz.subject || 'General',
        difficulty: quiz.difficulty || 'medium',
        score: session.score || 0,
        totalMarks: session.totalMarks || 0,
        accuracy: scoreAnalysis.accuracy,
        percentage: session.percentage || 0,
        passed: session.passed || false,
        totalQuestions: scoreAnalysis.totalQuestions,
        correct: scoreAnalysis.correct,
        wrong: scoreAnalysis.wrong,
        unattempted: scoreAnalysis.unattempted,
        timeSpent: session.timeSpent || 0,
        completedAt: session.completedAt || new Date().toISOString(),
        passingPercentage: quiz.passingPercentage || 60
      })
      
      return {
        scoreAnalysis,
        topicAnalysis,
        difficultyAnalysis,
        timeAnalysis,
        improvementAreas,
        nextActions
      }
    } catch (error) {
      console.error('Error calculating enhanced analysis:', error)
      return null
    }
  }, [result])

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      // Try ActiveQuiz endpoint first (for algorithm-generated quizzes)
      try {
        console.log('🔍 Trying ActiveQuiz result endpoint:', quizId)
        const response = await algorithmQuizService.getQuizResult(quizId)
        console.log('✅ Got ActiveQuiz result:', response)
        setResult(response.result)
        setLoading(false)
        return
      } catch (activeQuizError) {
        // If 404, it might be a regular quiz or from history
        if (activeQuizError.response?.status === 404) {
          console.log('⚠️ Not an ActiveQuiz, trying regular quiz endpoint')
          
          // Try regular quiz endpoint
          try {
            const response = await quizService.getQuizResult(quizId)
            setResult(response.result)
            setLoading(false)
            return
          } catch (regularQuizError) {
            // If still 404, try fetching from history
            if (regularQuizError.response?.status === 404) {
              console.log('⚠️ Not a regular quiz either, trying quiz history')
              await fetchResultsFromHistory()
              // fetchResultsFromHistory handles its own loading state
              return
            } else {
              throw regularQuizError
            }
          }
        } else {
          throw activeQuizError
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results')
      console.error('❌ Error fetching results:', err)
      setLoading(false)
    }
  }

  const fetchResultsFromHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching results from history:', {
        quizId,
        quizIdType: typeof quizId,
        hasLocationState: !!location.state,
        sessionId: location.state?.sessionId,
        locationState: location.state,
        willUseSessionIdFallback: !quizId && location.state?.sessionId
      });
      
      // If quizId is not available from URL, try to use sessionId from state
      const searchId = quizId || location.state?.sessionId;
      
      if (!searchId) {
        console.error('❌ No quizId or sessionId available for search');
        setError('Missing quiz identifier');
        setLoading(false);
        return;
      }
      
      // Fetch quiz session data from history
      const response = await algorithmQuizService.getQuizHistory({ limit: 1000 })
      const historyData = response.data || response || []
      
      console.log('📦 History data received:', {
        totalRecords: historyData.length,
        searchId,
        searchIdType: typeof searchId,
        firstRecord: historyData[0] ? {
          id: historyData[0].id,
          quizId: historyData[0].quizId,
          idType: typeof historyData[0].id,
          quizIdType: typeof historyData[0].quizId
        } : null
      });
      
      // ✅ Try to find session by matching quizId (convert both to strings for comparison)
      const sessionData = historyData.find(h => {
        const matchById = String(h.quizId) === String(searchId);
        const matchByQuizId = String(h.id) === String(searchId);
        const matchByMongoId = String(h._id) === String(searchId);
        
        console.log('🔍 Matching attempt:', {
          recordId: h.id,
          recordQuizId: h.quizId,
          searchId,
          matchById,
          matchByQuizId,
          matchByMongoId
        });
        
        return matchById || matchByQuizId || matchByMongoId;
      })
      
      if (!sessionData) {
        console.error('❌ Quiz session not found in history for searchId:', searchId);
        console.error('Available IDs:', historyData.map(h => ({
          id: h.id,
          quizId: h.quizId,
          subject: h.subject
        })));
        setError('Quiz results not found in history')
        setLoading(false)
        return
      }

      console.log('✅ Session data loaded:', {
        id: sessionData.id,
        quizId: sessionData.quizId,
        subject: sessionData.subject,
        hasQuestions: !!sessionData.questions,
        questionsCount: sessionData.questions?.length || 0,
        hasAnswers: !!sessionData.answers,
        answersCount: sessionData.answers?.length || 0,
        hasPerformanceByDifficulty: !!sessionData.performanceByDifficulty,
        performanceByDifficultyType: typeof sessionData.performanceByDifficulty,
        performanceByDifficultyIsArray: Array.isArray(sessionData.performanceByDifficulty),
        performanceByDifficultyLength: sessionData.performanceByDifficulty?.length || 0,
        performanceByDifficultyData: sessionData.performanceByDifficulty,
        sampleQuestion: sessionData.questions?.[0],
        sampleAnswer: sessionData.answers?.[0],
        questionsType: typeof sessionData.questions,
        answersType: typeof sessionData.answers
      });
      
      // ✅ PHASE 2: Validate session has required data
      if (!sessionData.questions || sessionData.questions.length === 0) {
        console.error('Session found but has no questions');
        setError('Quiz session data is incomplete');
        setLoading(false);
        return;
      }

      // Transform session data to result format
      const transformedResult = {
        quiz: {
          _id: sessionData.quizId,
          title: `${sessionData.subject} - ${sessionData.courseName}`,
          subject: sessionData.subject,
          difficulty: sessionData.difficulty,
          passingPercentage: 60,
          duration: sessionData.duration
        },
        session: {
          _id: sessionData.id,
          score: sessionData.score || 0,
          totalMarks: sessionData.totalScore || 0,
          percentage: sessionData.accuracy || 0,
          passed: (sessionData.accuracy || 0) >= 60,
          timeSpent: sessionData.timeTaken || 0,
          completedAt: sessionData.completedAt,
          pendingManualEvaluation: false,
          attemptNumber: 1
        },
        evaluation: {
          overallAnalysis: {
            totalQuestions: sessionData.questionCount || 0,
            correct: Math.round((sessionData.accuracy || 0) * (sessionData.questionCount || 0) / 100),
            wrong: (sessionData.questionCount || 0) - Math.round((sessionData.accuracy || 0) * (sessionData.questionCount || 0) / 100),
            unattempted: 0,
            accuracy: sessionData.accuracy || 0
          },
          // ✅ Use backend performance data when available
          topicAnalysis: Array.isArray(sessionData.performanceByTopic) && sessionData.performanceByTopic.length > 0
            ? sessionData.performanceByTopic.map(topic => ({
                topic: topic.topic,
                total: parseInt(topic.total) || 0,
                correct: parseInt(topic.correct) || 0,
                wrong: (parseInt(topic.total) || 0) - (parseInt(topic.correct) || 0),
                unattempted: 0,
                accuracy: parseFloat(topic.accuracy) || 0
              }))
            : [],
          difficultyAnalysis: (() => {
            console.log('🔄 Transforming difficulty analysis:', {
              isArray: Array.isArray(sessionData.performanceByDifficulty),
              length: sessionData.performanceByDifficulty?.length || 0,
              data: sessionData.performanceByDifficulty
            });
            
            if (Array.isArray(sessionData.performanceByDifficulty) && sessionData.performanceByDifficulty.length > 0) {
              const transformed = Object.fromEntries(
                sessionData.performanceByDifficulty.map((perf) => [
                  perf.difficulty,
                  {
                    total: parseInt(perf.total) || 0,
                    correct: parseInt(perf.correct) || 0,
                    wrong: (parseInt(perf.total) || 0) - (parseInt(perf.correct) || 0),
                    accuracy: parseFloat(perf.accuracy) || 0
                  }
                ])
              );
              console.log('✅ Transformed difficulty analysis:', transformed);
              return transformed;
            } else if (sessionData.performanceByDifficulty && typeof sessionData.performanceByDifficulty === 'object' && !Array.isArray(sessionData.performanceByDifficulty)) {
              const transformed = Object.fromEntries(
                Object.entries(sessionData.performanceByDifficulty).map(([difficulty, perf]) => [
                  difficulty,
                  {
                    total: parseInt(perf.total) || 0,
                    correct: parseInt(perf.correct) || 0,
                    wrong: (parseInt(perf.total) || 0) - (parseInt(perf.correct) || 0),
                    accuracy: parseFloat(perf.accuracy) || 0
                  }
                ])
              );
              console.log('✅ Transformed legacy difficulty analysis:', transformed);
              return transformed;
            } else {
              console.log('❌ No difficulty analysis data');
              return {};
            }
          })(),
          timeAnalysis: {
            totalTimeUsed: sessionData.timeTaken || 0,
            totalTimeAllowed: (sessionData.duration || 0) * 60,
            timeUtilization: sessionData.timeUtilization || 0
          },
          // ✅ Include backend recommendations and weak topics
          weakTopics: sessionData.weakTopics || [],
          recommendations: sessionData.recommendations || []
        },
        detailedAnswers: sessionData.questions?.map((q, index) => {
          console.log('🔧 Processing question:', {
            index,
            questionId: q.questionId,
            questionIdType: typeof q.questionId,
            hasSnapshot: !!q.snapshot,
            snapshotType: typeof q.snapshot,
            answersCount: sessionData.answers?.length || 0,
            questionFields: Object.keys(q)
          });
          
          // ✅ Find answer by matching questionId (try both string and object comparison)
          const answer = sessionData.answers?.find(a => {
            const matchByString = String(a.questionId) === String(q.questionId);
            const matchByIndex = sessionData.answers.indexOf(a) === index; // Fallback: match by index
            const match = matchByString || matchByIndex;
            
            console.log('🔧 Answer matching:', {
              answerQuestionId: a.questionId,
              questionQuestionId: q.questionId,
              matchByString,
              matchByIndex,
              finalMatch: match,
              index
            });
            return match;
          });
          
          // ✅ Backend already parsed snapshots and exposed fields at top level
          // Use fields directly from q (backend already flattened them)
          const questionData = {
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            expectedAnswer: q.expectedAnswer,
            numericalAnswer: q.numericalAnswer,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            topic: q.topic,
            difficultyLevel: q.difficultyLevel || q.difficulty,
            explanation: q.explanation
          };
          
          // ✅ Log processed data
          console.log('Processing question for analysis:', {
            index,
            questionId: q.questionId,
            hasAnswer: !!answer,
            topic: questionData.topic,
            difficulty: questionData.difficultyLevel,
            correctAnswer: questionData.correctAnswer,
            yourAnswer: answer?.answer,
            isCorrect: answer?.isCorrect,
            timeSpent: answer?.timeSpent,
            options: questionData.options,
            questionType: questionData.type
          });
          
          // ✅ Convert answer ID to text for display
          const rawAnswer = answer?.answer;
          console.log('🔄 Converting answer:', {
            rawAnswer,
            questionType: questionData.type,
            hasOptions: !!questionData.options,
            optionsCount: questionData.options?.length || 0,
            firstOption: questionData.options?.[0]
          });
          
          const displayAnswer = rawAnswer ? getUserAnswerDisplay(questionData, rawAnswer) : rawAnswer;
          
          console.log('✅ Answer converted:', {
            rawAnswer,
            displayAnswer
          });
          
          return {
            questionId: q.questionId,
            questionText: questionData.text,
            type: questionData.type || 'mcq-single',
            options: questionData.options || [],
            correctAnswer: questionData.correctAnswer,
            expectedAnswer: questionData.expectedAnswer,
            numericalAnswer: questionData.numericalAnswer,
            yourAnswer: displayAnswer, // Use converted text instead of raw ID
            isCorrect: answer?.isCorrect,
            marks: questionData.marks || 1,
            marksAwarded: answer?.marksAwarded || 0,
            timeSpent: answer?.timeSpent || 0,
            topic: questionData.topic,
            difficulty: questionData.difficultyLevel,
            explanation: questionData.explanation || ''
          }
        }) || []
      }

      console.log('🔧 Detailed answers mapping complete:', {
        inputQuestionsCount: sessionData.questions?.length || 0,
        inputAnswersCount: sessionData.answers?.length || 0,
        outputDetailedAnswersCount: transformedResult.detailedAnswers?.length || 0,
        sampleOutput: transformedResult.detailedAnswers?.[0]
      });

      console.log('🎯 Transformed result:', {
        hasQuiz: !!transformedResult.quiz,
        hasSession: !!transformedResult.session,
        hasEvaluation: !!transformedResult.evaluation,
        detailedAnswersCount: transformedResult.detailedAnswers?.length || 0,
        quizTitle: transformedResult.quiz?.title,
        sessionScore: transformedResult.session?.score,
        totalQuestions: transformedResult.evaluation?.overallAnalysis?.totalQuestions,
        firstDetailedAnswer: transformedResult.detailedAnswers?.[0],
        detailedAnswersPreview: transformedResult.detailedAnswers?.slice(0, 2),
        hasTopicAnalysis: !!transformedResult.evaluation?.topicAnalysis,
        topicAnalysisLength: transformedResult.evaluation?.topicAnalysis?.length || 0,
        topicAnalysisData: transformedResult.evaluation?.topicAnalysis,
        hasDifficultyAnalysis: !!transformedResult.evaluation?.difficultyAnalysis,
        difficultyAnalysisKeys: Object.keys(transformedResult.evaluation?.difficultyAnalysis || {}),
        difficultyAnalysisData: transformedResult.evaluation?.difficultyAnalysis,
        hasWeakTopics: !!transformedResult.evaluation?.weakTopics,
        weakTopicsCount: transformedResult.evaluation?.weakTopics?.length || 0,
        weakTopicsData: transformedResult.evaluation?.weakTopics,
        hasRecommendations: !!transformedResult.evaluation?.recommendations,
        recommendationsCount: transformedResult.evaluation?.recommendations?.length || 0,
        recommendationsData: transformedResult.evaluation?.recommendations
      });

      setResult(transformedResult)
      console.log('✅ Result state set successfully with backend data');
      setLoading(false)
    } catch (err) {
      console.error('❌ Failed to load results from history:', err)
      setError('Failed to load quiz results')
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await quizEvaluationService.getStudentAnalytics(user._id)
      setAnalytics(response.analytics)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'text-green-600'
    if (['B+', 'B'].includes(grade)) return 'text-blue-600'
    if (['C+', 'C'].includes(grade)) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  if (!result) {
    console.log('⚠️ Result is null, not rendering');
    return null
  }

  console.log('📊 Rendering with result:', {
    hasResult: !!result,
    hasSession: !!result.session,
    hasEvaluation: !!result.evaluation,
    hasDetailedAnswers: !!result.detailedAnswers,
    hasQuiz: !!result.quiz,
    detailedAnswersLength: result.detailedAnswers?.length
  });

  const { session, evaluation, detailedAnswers, quiz } = result

  return (
    <>

    <SEOHead title="Quiz Results - Student" noIndex={true} noFollow={true} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => navigate('/student/quizzes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 min-h-[44px] px-2 py-1"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">Back to Quizzes</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              <span className="meritai-title-gradient">{quiz?.title}</span>
            </h1>
            <p className="mt-1 text-gray-600 text-sm sm:text-base">Quiz Results</p>
          </div>

          {isAutoSubmit && (
            <div className="px-3 py-2 sm:px-4 bg-yellow-100 text-yellow-800 rounded-lg text-xs sm:text-sm w-fit">
              Quiz was auto-submitted due to time expiry
            </div>
          )}
        </div>
      </div>

      {/* Result Summary Card */}
      <div className={`genz-card rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 ${session.passed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' : 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center flex-shrink-0 shadow-xl ${session.passed ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-bounce-slow' : 'bg-gradient-to-br from-red-400 to-pink-500'}`}>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                {Math.round(session.percentage)}%
              </span>
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${session.passed ? 'text-green-800' : 'text-red-800'}`}>
                {session.passed ? '🎉 Woohoo! You Crushed It!' : '� Almost There! Keep Going!'}
              </h2>
              <p className={`mt-1 text-sm sm:text-base ${session.passed ? 'text-green-600' : 'text-red-600'}`}>
                Passing percentage: {quiz?.passingPercentage}% {session.passed ? '✨' : '🎯'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right lg:text-right">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              {session.score} / {session.totalMarks}
            </div>
            {evaluation?.grade && (
              <div className={`text-lg sm:text-xl lg:text-2xl font-bold ${getGradeColor(evaluation.grade)}`}>
                Grade: {evaluation.grade}
              </div>
            )}
          </div>
        </div>

        {session.pendingManualEvaluation && (
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-yellow-800 text-sm">
            ⚠️ Some answers require manual evaluation. Your final score may change.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex overflow-x-auto sm:overflow-x-visible sm:flex-wrap sm:space-x-8">
          {['overview', 'detailed', 'analysis', 'suggestions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          session={session} 
          evaluation={evaluation} 
          formatTime={formatTime} 
        />
      )}

      {/* New Achievements Section */}
      {newBadges && newBadges.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🏆</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Congratulations! New Achievements Unlocked</h3>
              <p className="text-sm text-gray-600">You've earned {newBadges.length} new badge{newBadges.length > 1 ? 's' : ''} for this quiz!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {newBadges.map((badge, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border-2 border-yellow-300 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{badge.badgeIcon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{badge.badgeName}</h4>
                    <p className="text-xs text-gray-600">{badge.badgeDescription}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        badge.level === 'bronze' ? 'text-amber-700 bg-amber-100' :
                        badge.level === 'silver' ? 'text-gray-600 bg-gray-200' :
                        badge.level === 'gold' ? 'text-yellow-600 bg-yellow-100' :
                        badge.level === 'platinum' ? 'text-purple-600 bg-purple-100' :
                        'text-blue-600 bg-blue-100'
                      }`}>
                        {badge.level.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-primary-600">+{badge.points} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'detailed' && <DetailedTab detailedAnswers={detailedAnswers} />}

      {activeTab === 'analysis' && (
        <AnalysisTab enhancedAnalysis={enhancedAnalysis} evaluation={evaluation} />
      )}

      {activeTab === 'suggestions' && (
        <SuggestionsTab result={result} enhancedAnalysis={enhancedAnalysis} />
      )}
    </div>
    </>
  )
}
