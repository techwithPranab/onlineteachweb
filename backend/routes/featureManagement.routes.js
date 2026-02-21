const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');
const featureManagementController = require('../controllers/featureManagement.controller');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Feature definitions
router.get('/features', featureManagementController.getAllFeatures);
router.get('/features/category/:category', featureManagementController.getFeaturesByCategory);
router.get('/features/analytics', featureManagementController.getFeatureAnalytics);
router.post('/features/seed', featureManagementController.seedFeatures);
router.get('/features/:key', featureManagementController.getFeature);
router.post('/features', featureManagementController.createFeature);
router.put('/features/:key', featureManagementController.updateFeature);
router.delete('/features/:key', featureManagementController.deleteFeature);

// Subscription plan features
router.get('/subscription-plans/features/compare', featureManagementController.comparePlanFeatures);
router.put('/subscription-plans/:id/features', featureManagementController.updatePlanFeatures);
router.post('/subscription-plans/features/bulk-update', featureManagementController.bulkUpdatePlanFeatures);

module.exports = router;
