const express = require('express');
const { body, param } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Enforce admin role for all routes in this router
router.use(requireAuth, requireRole('admin'));

router.get('/campaigns/pending', adminController.getPendingCampaigns);

router.post(
  '/campaigns/:id/approve',
  [param('id').isInt({ min: 1 }), validate],
  adminController.approveCampaign
);

router.post(
  '/campaigns/:id/reject',
  [
    param('id').isInt({ min: 1 }),
    body('reason').trim().isLength({ min: 3, max: 1000 }).withMessage('Rejection reason required (3-1000 characters).'),
    validate,
  ],
  adminController.rejectCampaign
);

router.get('/reports/top-campaigns', adminController.getTopCampaignsReport);
router.get('/reports/category-success', adminController.getCategorySuccessReport);
router.get('/reports/monthly-trend', adminController.getMonthlyTrendReport);
router.get('/reports/repeat-backers', adminController.getRepeatBackersReport);

router.get('/users', adminController.getUsers);

router.patch(
  '/users/:id/status',
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['active', 'suspended']).withMessage('Status must be active or suspended.'),
    validate,
  ],
  adminController.updateUserStatus
);

module.exports = router;

