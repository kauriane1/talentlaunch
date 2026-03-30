// routes/talentRoutes.js

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const {
  getAllTalents, getTalentById,
  createTalent, updateTalent, deleteTalent,
} = require('../controllers/talentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const talentRules = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('description').trim().notEmpty().withMessage('Description is required.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
];

// Public
router.get('/',    getAllTalents);
router.get('/:id', getTalentById);

// Protected
function optionalUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (contentType.startsWith('multipart/form-data')) {
    return upload.single('file')(req, res, next);
  }
  return next();
}

router.post('/', protect, optionalUpload, talentRules, createTalent);
router.put('/:id', protect, updateTalent);
router.delete('/:id', protect, deleteTalent);

module.exports = router;