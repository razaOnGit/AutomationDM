const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Instagram OAuth callback
router.post('/instagram/callback', authController.instagramCallback);

// Verify JWT token
router.get('/verify', authenticateToken, authController.verifyToken);

// Refresh Instagram access token
router.post('/refresh', authenticateToken, authController.refreshToken);

// Logout
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;