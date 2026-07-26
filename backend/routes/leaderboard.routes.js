const express = require('express');
const router = express.Router();
const StudentPerformance = require('../models/StudentPerformance.model');
const { authenticate } = require('../middleware/auth');

/**
 * Leaderboard Routes
 * GET /api/leaderboard  → top students by totalXP + requesting user's rank
 */

// Helper: compute level number from totalXP (mirrors frontend xpSystem.js)
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3100, 4300, 6000];
function getLevelNumber(totalXP) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 10);
}
const LEVEL_TITLES = ['Rookie','Explorer','Learner','Scholar','Achiever','Skilled','Master','Champion','Elite','Legend'];
const LEVEL_EMOJIS = ['🌱','🔍','📖','🎓','⭐','💡','🔥','🏆','💎','👑'];

// @route   GET /api/leaderboard
// @desc    Get top students + requesting student's rank
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit  = Math.min(parseInt(req.query.limit) || 10, 50);

    // Top N students by totalXP
    const topRecords = await StudentPerformance
      .find({ totalXP: { $gt: 0 } })
      .sort({ totalXP: -1 })
      .limit(limit)
      .populate('studentId', 'name avatar grade');

    // Current user's total XP
    const myRecord = await StudentPerformance.findOne(
      { studentId: userId },
      { totalXP: 1 }
    );
    const myXP = myRecord?.totalXP || 0;

    // My rank = number of students who have strictly MORE XP than me + 1
    const myRank = await StudentPerformance.countDocuments({ totalXP: { $gt: myXP } }) + 1;

    const leaderboard = topRecords
      .filter(r => r.studentId) // guard against deleted users
      .map((r, i) => {
        const lvl = getLevelNumber(r.totalXP || 0);
        return {
          rank:    i + 1,
          userId:  r.studentId._id,
          name:    r.studentId.name || 'Anonymous',
          avatar:  r.studentId.avatar || '',
          grade:   r.studentId.grade  || null,
          totalXP: r.totalXP || 0,
          level:   lvl,
          title:   LEVEL_TITLES[lvl - 1],
          emoji:   LEVEL_EMOJIS[lvl - 1],
          isMe:    r.studentId._id.toString() === userId.toString(),
        };
      });

    res.json({
      success: true,
      data: {
        leaderboard,
        myRank,
        myXP,
        myLevel:  getLevelNumber(myXP),
        myTitle:  LEVEL_TITLES[getLevelNumber(myXP) - 1],
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
