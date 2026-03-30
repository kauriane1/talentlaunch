// routes/workshopRoutes.js

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const {
  getAllWorkshops, getWorkshopById, getMyWorkshops,
  createWorkshop, updateWorkshop, deleteWorkshop,
  enrollInWorkshop, unenrollFromWorkshop,
} = require('../controllers/workshopController');
const { protect, adminOnly } = require('../middleware/auth');

const workshopRules = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('date').isISO8601().withMessage('A valid date is required.'),
];

// Public
router.get('/',    getAllWorkshops);
router.get('/:id', getWorkshopById);

// Authenticated users
router.get('/my',   protect, getMyWorkshops);
router.post('/:id/enroll',   protect, enrollInWorkshop);
router.delete('/:id/enroll', protect, unenrollFromWorkshop);

module.exports = router;