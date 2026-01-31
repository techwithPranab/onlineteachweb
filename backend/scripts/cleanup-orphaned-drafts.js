const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupOrphanedDrafts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const AIQuestionDraft = require('../models/AIQuestionDraft.model');
    const Course = require('../models/Course.model');
    
    console.log('🔍 Checking for orphaned drafts...');
    const allDrafts = await AIQuestionDraft.find({});
    console.log(`Total drafts: ${allDrafts.length}`);
    
    const orphanedDraftIds = [];
    
    for (const draft of allDrafts) {
      const courseId = draft.questionPayload?.courseId;
      if (courseId) {
        const course = await Course.findById(courseId);
        if (!course) {
          console.log(`  ❌ Orphaned draft: ${draft._id} (course ${courseId} not found)`);
          orphanedDraftIds.push(draft._id);
        }
      } else {
        console.log(`  ❌ Draft without courseId: ${draft._id}`);
        orphanedDraftIds.push(draft._id);
      }
    }
    
    console.log(`\n📊 Found ${orphanedDraftIds.length} orphaned drafts`);
    
    if (orphanedDraftIds.length > 0) {
      const result = await AIQuestionDraft.deleteMany({ _id: { $in: orphanedDraftIds } });
      console.log(`✅ Deleted ${result.deletedCount} orphaned drafts`);
    } else {
      console.log('✅ No orphaned drafts found - all drafts are valid!');
    }
    
    await mongoose.disconnect();
    console.log('\n✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupOrphanedDrafts();
