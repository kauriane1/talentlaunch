// routes/authRoutes.js

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { register, login, createAdmin, getMe, updateProfile } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/admin',    protect, adminOnly, registerRules, createAdmin);
router.get('/me',        protect,       getMe);
router.put('/me',        protect, upload.single('avatar'), updateProfile);

module.exports = router;