/**
 * XP & Leveling System for MeriTai Playground
 *
 * XP Earn Rules:
 *   - Attempting a quiz:         +10 XP (base)
 *   - Per correct answer:        +5 XP
 *   - Score bonus ≥ 90%:         +50 XP
 *   - Score bonus ≥ 70%:         +25 XP
 *   - Score bonus ≥ 50%:         +10 XP
 *   - Difficulty multiplier:     easy=1x · medium=1.5x · hard=2x
 */

// ─── Level Definitions ───────────────────────────────────────────────────────
// Each entry: { level, title, emoji, color (Tailwind token), minXP (cumulative) }
export const LEVELS = [
  { level: 1,  title: 'Rookie',    emoji: '🌱', color: 'gray',   minXP: 0     },
  { level: 2,  title: 'Explorer',  emoji: '🔍', color: 'green',  minXP: 100   },
  { level: 3,  title: 'Learner',   emoji: '📖', color: 'blue',   minXP: 300   },
  { level: 4,  title: 'Scholar',   emoji: '🎓', color: 'cyan',   minXP: 600   },
  { level: 5,  title: 'Achiever',  emoji: '⭐', color: 'yellow', minXP: 1000  },
  { level: 6,  title: 'Skilled',   emoji: '💡', color: 'orange', minXP: 1500  },
  { level: 7,  title: 'Master',    emoji: '🔥', color: 'red',    minXP: 2200  },
  { level: 8,  title: 'Champion',  emoji: '🏆', color: 'purple', minXP: 3100  },
  { level: 9,  title: 'Elite',     emoji: '💎', color: 'violet', minXP: 4300  },
  { level: 10, title: 'Legend',    emoji: '👑', color: 'amber',  minXP: 6000  },
]

/** Tailwind gradient classes per level */
export const LEVEL_GRADIENTS = {
  1:  'from-gray-400 to-gray-500',
  2:  'from-green-400 to-emerald-500',
  3:  'from-blue-400 to-blue-600',
  4:  'from-cyan-400 to-teal-500',
  5:  'from-yellow-400 to-amber-500',
  6:  'from-orange-400 to-orange-600',
  7:  'from-red-400 to-rose-600',
  8:  'from-purple-400 to-purple-700',
  9:  'from-violet-400 to-violet-700',
  10: 'from-amber-400 via-yellow-300 to-orange-500',
}

/** Tailwind badge background classes per level */
export const LEVEL_BADGE_BG = {
  1:  'bg-gray-100 text-gray-700 border-gray-300',
  2:  'bg-green-100 text-green-700 border-green-300',
  3:  'bg-blue-100 text-blue-700 border-blue-300',
  4:  'bg-cyan-100 text-cyan-700 border-cyan-300',
  5:  'bg-yellow-100 text-yellow-700 border-yellow-300',
  6:  'bg-orange-100 text-orange-700 border-orange-300',
  7:  'bg-red-100 text-red-700 border-red-300',
  8:  'bg-purple-100 text-purple-700 border-purple-300',
  9:  'bg-violet-100 text-violet-700 border-violet-300',
  10: 'bg-amber-100 text-amber-700 border-amber-300',
}

// ─── XP Calculation ───────────────────────────────────────────────────────────

const DIFFICULTY_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2 }

/**
 * Compute XP earned for a single quiz attempt.
 * @param {Object} quiz - quiz history item
 * @param {number} quiz.score            - percentage score (0-100)
 * @param {number} quiz.correctAnswers   - number of correct answers
 * @param {number} quiz.totalQuestions   - total questions in quiz
 * @param {string} [quiz.difficulty]     - 'easy' | 'medium' | 'hard'
 * @returns {number} XP earned
 */
export function computeXPForQuiz(quiz) {
  const score = quiz.score ?? quiz.percentage ?? 0
  const correct = quiz.correctAnswers ?? quiz.correct ?? 0
  const difficulty = quiz.difficulty || 'medium'
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1

  let xp = 10 // base for attempting
  xp += Math.round(correct * 5 * multiplier)

  // Score bonus
  if (score >= 90) xp += 50
  else if (score >= 70) xp += 25
  else if (score >= 50) xp += 10

  return xp
}

/**
 * Compute total XP from an array of quiz history items.
 * @param {Array} quizHistory
 * @returns {number} total XP
 */
export function computeXPFromHistory(quizHistory = []) {
  return quizHistory.reduce((total, quiz) => total + computeXPForQuiz(quiz), 0)
}

// ─── Level Lookup ─────────────────────────────────────────────────────────────

/**
 * Given total XP, return full level information.
 * @param {number} totalXP
 * @returns {{
 *   currentLevel: Object,   // LEVELS entry
 *   nextLevel: Object|null, // LEVELS entry or null if max level
 *   xpIntoLevel: number,    // XP earned above current level threshold
 *   xpNeededForNext: number,// XP gap between current and next level
 *   progressPercent: number,// 0-100 progress toward next level
 *   isMaxLevel: boolean,
 * }}
 */
export function getLevelInfo(totalXP) {
  // Find highest level whose minXP <= totalXP
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (totalXP >= lvl.minXP) current = lvl
    else break
  }

  const nextIndex = LEVELS.findIndex(l => l.level === current.level + 1)
  const next = nextIndex !== -1 ? LEVELS[nextIndex] : null
  const isMaxLevel = !next

  const xpIntoLevel = totalXP - current.minXP
  const xpNeededForNext = next ? next.minXP - current.minXP : 1
  const progressPercent = isMaxLevel
    ? 100
    : Math.min(100, Math.round((xpIntoLevel / xpNeededForNext) * 100))

  return {
    currentLevel: current,
    nextLevel: next,
    xpIntoLevel,
    xpNeededForNext,
    progressPercent,
    isMaxLevel,
  }
}

/**
 * Quick helper — returns just the level number for a given XP total.
 */
export function getLevelNumber(totalXP) {
  return getLevelInfo(totalXP).currentLevel.level
}
