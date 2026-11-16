const express = require('express');
const router = express.Router();
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getUpcomingFollowUps,
  getStatsSummary,
} = require('../controllers/applicationController');
const { validateApplication } = require('../middleware/validate');

// Root collection routes
router.route('/')
  .get(getApplications)
  .post(validateApplication, createApplication);

// Specific named routes (defined before :id to prevent matching as id)
router.get('/followups/upcoming', getUpcomingFollowUps);
router.get('/stats/summary', getStatsSummary);

// Single item routes
router.route('/:id')
  .get(getApplicationById)
  .put(validateApplication, updateApplication)
  .delete(deleteApplication);

module.exports = router;
