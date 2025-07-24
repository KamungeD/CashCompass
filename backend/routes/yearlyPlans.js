const express = require('express');
const router = express.Router();
const yearlyPlanController = require('../controllers/yearlyPlanController');
const { authenticate: protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Get yearly plan overview
router.get('/:year', yearlyPlanController.getYearlyPlan);

// Get yearly financial summary
router.get('/:year/summary', yearlyPlanController.getYearlySummary);

// Update yearly goals
router.put('/:year/goals', yearlyPlanController.updateYearlyGoals);

// Create monthly budget template
router.post('/:year/template', yearlyPlanController.createMonthlyTemplate);

// Update yearly settings
router.put('/:year/settings', yearlyPlanController.updateYearlySettings);

// Get category trends
router.get('/:year/trends', yearlyPlanController.getCategoryTrends);

// Delete yearly plan
router.delete('/:year', yearlyPlanController.deleteYearlyPlan);

module.exports = router;
