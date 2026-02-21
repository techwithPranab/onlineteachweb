const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userFeaturesController = require('../controllers/userFeatures.controller');

// All routes require authentication
router.use(authenticate);

// User feature access
router.get('/me/features', userFeaturesController.getMyFeatures);
router.get('/me/features/usage', userFeaturesController.getFeatureUsage);
router.get('/me/features/restrictions', userFeaturesController.getMyRestrictions);
router.get('/me/features/:featureKey/check', userFeaturesController.checkFeatureAccess);
router.get('/me/features/:featureKey/usage', userFeaturesController.getSpecificFeatureUsage);
router.get('/me/subscription/features', userFeaturesController.getSubscriptionFeatures);

module.exports = router;
