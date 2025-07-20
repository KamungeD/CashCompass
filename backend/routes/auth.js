const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe: getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification: resendEmailVerification,
  refreshToken,
  deleteAccount
} = require('../controllers/authController');

const { authenticate: protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes
router.post('/register', validate('register'), register);
router.post('/login', validate('login'), login);
router.post('/forgot-password', validate('forgotPassword'), forgotPassword);
router.post('/reset-password', validate('resetPassword'), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', validate('resendVerification'), resendEmailVerification);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate('updateProfile'), updateProfile);
router.put('/change-password', validate('changePassword'), changePassword);
router.post('/logout', logout);
router.delete('/account', deleteAccount);

module.exports = router;
