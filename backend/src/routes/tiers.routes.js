const express = require('express');
const { body, param } = require('express-validator');
const tiersController = require('../controllers/tiers.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

router.post(
  '/',
  requireAuth,
  [
    param('id').isInt({ min: 1 }),
    body('title').trim().isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters.'),
    body('description').trim().isLength({ min: 5 }).withMessage('Description must be at least 5 characters.'),
    body('minAmount').isFloat({ min: 0.01 }).withMessage('Minimum amount must be greater than zero.'),
    body('quantity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Quantity must be a positive integer.'),
    validate,
  ],
  tiersController.createTier
);

router.put(
  '/:tierId',
  requireAuth,
  [
    param('id').isInt({ min: 1 }),
    param('tierId').isInt({ min: 1 }),
    body('title').optional().trim().isLength({ min: 2, max: 150 }),
    body('description').optional().trim().isLength({ min: 5 }),
    body('minAmount').optional().isFloat({ min: 0.01 }),
    body('quantity').optional({ nullable: true }).isInt({ min: 1 }),
    validate,
  ],
  tiersController.updateTier
);

router.delete(
  '/:tierId',
  requireAuth,
  [
    param('id').isInt({ min: 1 }),
    param('tierId').isInt({ min: 1 }),
    validate,
  ],
  tiersController.deleteTier
);

module.exports = router;

