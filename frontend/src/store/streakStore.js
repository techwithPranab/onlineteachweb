import { create } from 'zustand'
import { streakService } from '../services/apiServices'

/**
 * Streak Store — manages the student's daily streak & activity calendar.
 *
 * Flow:
 *   1. On dashboard mount  → fetchStreak()
 *   2. On dashboard mount  → checkIn()  (once per day, backend dedupes)
 *   3. On quiz completion  → checkIn()  (reinforces the habit loop)
 *   4. On logout           → resetStreak()
 */
export const useStreakStore = create((set, get) => ({
  currentStreak:    0,
  longestStreak:    0,
  lastActivityDate: null,
  activityDates:    [],    // array of 'YYYY-MM-DD' strings
  loading:          false,
  error:            null,

  /** Fetch streak data from the backend. */
  fetchStreak: async () => {
    set({ loading: true, error: null })
    try {
      const res = await streakService.getStreak()
      const d   = res?.data || {}
      set({
        currentStreak:    d.currentStreak    || 0,
        longestStreak:    d.longestStreak    || 0,
        lastActivityDate: d.lastActivityDate || null,
        activityDates:    d.activityDates    || [],
        loading: false,
      })
    } catch (err) {
      console.error('[StreakStore] fetchStreak failed:', err)
      set({ loading: false, error: 'Failed to load streak' })
    }
  },

  /** Record today's activity. Backend is idempotent (safe to call multiple times). */
  checkIn: async () => {
    try {
      const res = await streakService.checkIn()
      const d   = res?.data || {}
      set({
        currentStreak:    d.currentStreak    || 0,
        longestStreak:    d.longestStreak    || 0,
        lastActivityDate: d.lastActivityDate || null,
        activityDates:    d.activityDates    || [],
      })
    } catch (err) {
      console.error('[StreakStore] checkIn failed:', err)
    }
  },

  /** Clear in-memory state on logout. */
  resetStreak: () => set({
    currentStreak:    0,
    longestStreak:    0,
    lastActivityDate: null,
    activityDates:    [],
    loading:          false,
    error:            null,
  }),
}))
