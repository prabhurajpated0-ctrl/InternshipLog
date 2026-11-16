const { Application, STAGES } = require('../models/Application');

// @desc    Create new application
// @route   POST /api/applications
const createApplication = async (req, res, next) => {
  try {
    const {
      company,
      role,
      stage,
      deadline,
      appliedDate,
      followUpDate,
      followUpNote,
      location,
      link,
      notes,
    } = req.body;

    const application = await Application.create({
      company,
      role,
      stage: stage || 'Applied',
      deadline: deadline || null,
      appliedDate: appliedDate || Date.now(),
      followUpDate: followUpDate || null,
      followUpNote: followUpNote || '',
      location: location || '',
      link: link || '',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications (with ?stage= and ?search=)
// @route   GET /api/applications
const getApplications = async (req, res, next) => {
  try {
    const { stage, search, sort = '-appliedDate' } = req.query;
    const filter = {};

    if (stage) {
      filter.stage = stage;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { company: regex },
        { role: regex },
        { location: regex },
        { notes: regex },
        { followUpNote: regex },
      ];
    }

    const applications = await Application.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
const getApplicationById = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application
// @route   PUT /api/applications/:id
const updateApplication = async (req, res, next) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming follow-ups (next ?days=, default 7, plus overdue flagged)
// @route   GET /api/applications/followups/upcoming
const getUpcomingFollowUps = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 23, 59, 59, 999);

    // Fetch follow-ups on or before windowEnd (which includes overdue ones), excluding Offer & Rejected
    const applications = await Application.find({
      followUpDate: { $ne: null, $lte: windowEnd },
      stage: { $nin: ['Offer', 'Rejected'] },
    }).sort({ followUpDate: 1 });

    const formattedApplications = applications.map((app) => {
      const appObj = app.toObject ? app.toObject() : { ...app };
      const isOverdue = new Date(appObj.followUpDate) < startOfToday;
      return {
        ...appObj,
        isOverdue,
        overdue: isOverdue,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedApplications.length,
      daysWindow: days,
      data: formattedApplications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary statistics using MongoDB aggregation
// @route   GET /api/applications/stats/summary
const getStatsSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

    const [aggregationResult] = await Application.aggregate([
      {
        $facet: {
          totalCount: [
            { $count: 'total' },
          ],
          byStage: [
            {
              $group: {
                _id: '$stage',
                count: { $sum: 1 },
              },
            },
          ],
          upcomingDeadlines: [
            {
              $match: {
                deadline: { $gte: startOfToday, $lte: next7Days },
                stage: { $nin: ['Offer', 'Rejected'] },
              },
            },
            { $count: 'count' },
          ],
          upcomingFollowUps: [
            {
              $match: {
                followUpDate: { $ne: null, $lte: next7Days },
                stage: { $nin: ['Offer', 'Rejected'] },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    // Format total count
    const total = aggregationResult?.totalCount?.[0]?.total || 0;

    // Build complete stage map with 0 default for unrepresented stages
    const byStage = {};
    STAGES.forEach((stg) => {
      byStage[stg] = 0;
    });
    if (aggregationResult?.byStage) {
      aggregationResult.byStage.forEach((item) => {
        if (item._id) {
          byStage[item._id] = item.count;
        }
      });
    }

    // Number of upcoming deadlines in next 7 days
    const upcomingDeadlinesCount = aggregationResult?.upcomingDeadlines?.[0]?.count || 0;
    const upcomingFollowUpsCount = aggregationResult?.upcomingFollowUps?.[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        byStage,
        upcomingDeadlines: upcomingDeadlinesCount,
        upcomingDeadlinesCount,
        upcomingFollowUpsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  getUpcomingFollowUps,
  getStatsSummary,
};
