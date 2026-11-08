const express = require('express');
const { body, param } = require('express-validator');
const pledgesController = require('../controllers/pledges.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// GET /api/pledges/mine
router.get('/mine', requireAuth, pledgesController.getMyPledges);

// POST /api/pledges/:id/cancel
router.post(
  '/:id/cancel',
  requireAuth,
  [param('id').isInt({ min: 1 }).withMessage('Valid pledge ID required.'), validate],
  pledgesController.cancelPledge
);

module.exports = router;

