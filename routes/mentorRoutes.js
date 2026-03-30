// routes/mentorRoutes.js

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const {
  getAllMentors, getMentorById,
  createMentor, updateMentor, deleteMentor,
} = require('../controllers/mentorController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

const mentorRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
  body('specialty').trim().notEmpty().withMessage('Specialty is required.'),
];

// Public
router.get('/',    getAllMentors);
router.get('/:id', getMentorById);

// Admin only
router.post('/',    protect, adminOnly, upload.single('avatar'), mentorRules, createMentor);
router.put('/:id',  protect, adminOnly, upload.single('avatar'), updateMentor);
router.delete('/:id', protect, adminOnly, deleteMentor);

module.exports = router;