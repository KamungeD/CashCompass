const express = require('express');
const router = express.Router();

const {
  getBudgets,
  getActiveBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStats,
  resetBudget,
  addCategoryToBudget,
  removeCategoryFromBudget,
  getBudgetAlerts
} = require('../controllers/budgetController');

const { authenticate: protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Budget routes
router.route('/')
  .get(getBudgets)
  .post(validate('createBudget'), createBudget);

router.route('/active')
  .get(getActiveBudgets);

router.route('/stats')
  .get(getBudgetStats);

router.route('/:id')
  .get(getBudget)
  .put(validate('updateBudget'), updateBudget)
  .delete(deleteBudget);

router.route('/:id/reset')
  .post(validate('resetBudget'), resetBudget);

router.route('/:id/alerts')
  .get(getBudgetAlerts);

router.route('/:id/categories')
  .post(validate('addCategoryToBudget'), addCategoryToBudget);

router.route('/:id/categories/:categoryId')
  .delete(removeCategoryFromBudget);

module.exports = router;
