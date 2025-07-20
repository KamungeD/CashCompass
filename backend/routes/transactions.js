const express = require('express');
const router = express.Router();

const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  bulkCreateTransactions
} = require('../controllers/transactionController');

const { authenticate: protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Transaction CRUD routes
router.route('/')
  .get(getTransactions)
  .post(validate('createTransaction'), createTransaction);

router.route('/bulk')
  .post(validate('bulkCreateTransactions'), bulkCreateTransactions);

router.route('/stats')
  .get(getTransactionStats);

router.route('/:id')
  .get(getTransaction)
  .put(validate('updateTransaction'), updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
