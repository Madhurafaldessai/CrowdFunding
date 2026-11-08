const express = require('express');
const { param } = require('express-validator');
const creatorController = require('../controllers/creator.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/campaigns', requireAuth, creatorController.getCreatorCampaigns);

router.get(
  '/campaigns/:id/pledges',
  requireAuth,
  [param('id').isInt({ min: 1 }), validate],
  creatorController.getCampaignPledges
);

module.exports = router;

