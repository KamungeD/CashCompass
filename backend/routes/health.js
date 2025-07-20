const express = require('express');
const router = express.Router();

// @desc    Health check endpoint
// @route   GET /api/v1/health
// @access  Public
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CashCompass API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

module.exports = router;
