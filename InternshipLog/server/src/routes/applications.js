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
const {
  validateCreate,
  validateUpdate,
  validateObjectId,
} = require('../middleware/validate');

// Root collection routes
router.route('/')
  .get(getApplications)
  .post(validateCreate, createApplication);

// Specific named routes (defined before :id to prevent collision)
router.get('/followups/upcoming', getUpcomingFollowUps);
router.get('/stats/summary', getStatsSummary);
router.get('/metrics', getStatsSummary); // alias: GET /api/applications/metrics

// Single item routes with ObjectId validation
router.route('/:id')
  .get(validateObjectId, getApplicationById)
  .put(validateUpdate, updateApplication)
  .delete(validateObjectId, deleteApplication);

module.exports = router;
