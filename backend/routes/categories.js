const express = require('express');
const router = express.Router();

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryUsage,
  searchCategories,
  getCategoriesWithSubcategories,
  moveCategory,
  bulkUpdateCategories
} = require('../controllers/categoryController');

const { authenticate: protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Category routes
router.route('/')
  .get(getCategories)
  .post(validate('createCategory'), createCategory);

router.route('/tree')
  .get(getCategoryTree);

router.route('/with-subcategories')
  .get(getCategoriesWithSubcategories);

router.route('/search')
  .get(searchCategories);

router.route('/bulk-update')
  .patch(validate('bulkUpdateCategories'), bulkUpdateCategories);

router.route('/:id')
  .get(getCategory)
  .put(validate('updateCategory'), updateCategory)
  .delete(deleteCategory);

router.route('/:id/usage')
  .get(getCategoryUsage);

router.route('/:id/move')
  .patch(validate('moveCategory'), moveCategory);

module.exports = router;
