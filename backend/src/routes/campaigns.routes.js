const express = require('express');
const { body, param, query } = require('express-validator');
const campaignsController = require('../controllers/campaigns.controller');
const pledgesController = require('../controllers/pledges.controller');
const updatesController = require('../controllers/updates.controller');
const commentsController = require('../controllers/comments.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  campaignsController.getCampaigns
);

router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid campaign ID required.'), validate],
  campaignsController.getCampaignById
);

router.post(
  '/',
  requireAuth,
  [
    body('categoryId').isInt({ min: 1 }).withMessage('Valid category ID required.'),
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters.'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Short description must be between 10 and 500 characters.'),
    body('story').trim().isLength({ min: 20 }).withMessage('Campaign story must be at least 20 characters.'),
    body('goalAmount').isFloat({ min: 1 }).withMessage('Goal amount must be at least $1.'),
    body('deadline').isISO8601().withMessage('Valid deadline date required.'),
    validate,
  ],
  campaignsController.createCampaign
);

router.put(
  '/:id',
  requireAuth,
  [
    param('id').isInt({ min: 1 }),
    body('categoryId').optional().isInt({ min: 1 }),
    body('title').optional().trim().isLength({ min: 5, max: 200 }),
    body('description').optional().trim().isLength({ min: 10, max: 500 }),
    body('story').optional().trim().isLength({ min: 20 }),
    body('goalAmount').optional().isFloat({ min: 1 }),
    body('deadline').optional().isISO8601(),
    validate,
  ],
  campaignsController.updateCampaign
);

router.post(
  '/:id/submit',
  requireAuth,
  [param('id').isInt({ min: 1 }), validate],
  campaignsController.submitCampaign
);

router.post(
  '/:id/cancel',
  requireAuth,
  [param('id').isInt({ min: 1 }), validate],
  campaignsController.cancelCampaign
);

router.post(
  '/:id/pledges',
  requireAuth,
  [
    param('id').isInt({ min: 1 }).withMessage('Valid campaign ID required.'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Pledge amount must be greater than zero.'),
    body('tierId').optional({ nullable: true }).isInt({ min: 1 }),
    body('forcedPaymentOutcome').optional().isIn(['SUCCESS', 'FAILURE', 'success', 'failure']),
    validate,
  ],
  pledgesController.createPledge
);

// Updates endpoints
router.get(
  '/:id/updates',
  [param('id').isInt({ min: 1 }), validate],
  updatesController.getUpdates
);

router.post(
  '/:id/updates',
  requireAuth,
  [
    param('id').isInt({ min: 1 }),
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters.'),
    body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters.'),
    validate,
  ],
  updatesController.createUpdate
);

// Comments endpoints
router.get(
  '/:id/comments',
  [param('id').isInt({ min: 1 }), validate],
  commentsController.getComments
);

router.post(
  '/:id/comments',
  requireAuth,
  [
    param('id').isInt({ min: 1 }),
    body('comment').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment cannot be empty (max 2000 chars).'),
    validate,
  ],
  commentsController.createComment
);

module.exports = router;
