import { create } from 'zustand'
import {
  computeXPForQuiz,
  getLevelInfo,
} from '../utils/xpSystem'
import { xpService } from '../services/apiServices'

/**
 * XP Store — persists the student's XP in the backend (MongoDB).
 * No localStorage — XP is always fetched from the server on login.
 *
 * Flow:
 *   1. Student logs in  → call `fetchXPFromServer()`  in StudentDashboard
 *   2. Student submits a quiz → call `addXP(quiz)` in QuizAttempt
 *      → optimistically updates local state
 *      → fires `POST /api/student-performance/xp/add` in background
 *   3. Level-up detected → sets `isLevelingUp = true` → triggers overlay
 *   4. Logout → call `resetXP()` to clear in-memory state
 */
export const useXPStore = create((set, get) => ({
  totalXP: 0,
  levelInfo: getLevelInfo(0),
  isLevelingUp: false,
  levelUpDetails: null,
  loading: false,
  error: null,

  /**
   * Load XP from the backend for the logged-in student.
   * Call this once when the student dashboard mounts.
   */
  fetchXPFromServer: async () => {
    set({ loading: true, error: null })
    try {
      const response = await xpService.getXP()
      const serverXP = response?.data?.totalXP ?? 0
      set({
        totalXP: serverXP,
        levelInfo: getLevelInfo(serverXP),
        loading: false,
      })
    } catch (err) {
      console.error('[XPStore] Failed to fetch XP from server:', err)
      set({ loading: false, error: 'Failed to load XP' })
    }
  },

  /**
   * Award XP for a single completed quiz.
   * Optimistically updates local state, then syncs delta to the server.
   * Detects level-up and triggers the celebration animation.
   *
   * @param {Object} quiz  — { score, correctAnswers, difficulty }
   * @returns {number}     — XP earned
   */
  addXP: (quiz) => {
    const { totalXP, levelInfo } = get()
    const earned = computeXPForQuiz(quiz)
    const newTotal = totalXP + earned
    const newLevelInfo = getLevelInfo(newTotal)

    const didLevelUp =
      newLevelInfo.currentLevel.level > levelInfo.currentLevel.level

    // ── Optimistic local update ──────────────────────────────────────────────
    set({
      totalXP: newTotal,
      levelInfo: newLevelInfo,
      isLevelingUp: didLevelUp,
      levelUpDetails: didLevelUp
        ? { from: levelInfo.currentLevel, to: newLevelInfo.currentLevel }
        : null,
    })

    // ── Background sync to backend (fire-and-forget) ─────────────────────────
    xpService.addXP(earned).catch((err) => {
      console.error('[XPStore] Failed to sync XP delta to server:', err)
      // On failure, roll back to previous total to stay consistent with server
      set({ totalXP, levelInfo, isLevelingUp: false, levelUpDetails: null })
    })

    return earned
  },

  /** Call this after the level-up animation completes */
  clearLevelUp: () => set({ isLevelingUp: false, levelUpDetails: null }),

  /** Clear in-memory XP state on logout — does NOT touch the backend */
  resetXP: () =>
    set({
      totalXP: 0,
      levelInfo: getLevelInfo(0),
      isLevelingUp: false,
      levelUpDetails: null,
      loading: false,
      error: null,
    }),
}))

