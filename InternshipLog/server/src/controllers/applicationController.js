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

// @desc    Get upcoming follow-ups
// @route   GET /api/applications/followups/upcoming
const getUpcomingFollowUps = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = await Application.find({
      followUpDate: { $gte: today },
      stage: { $nin: ['Rejected', 'Offer'] },
    }).sort({ followUpDate: 1 });

    res.status(200).json({
      success: true,
      count: upcoming.length,
      data: upcoming,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary statistics
// @route   GET /api/applications/stats/summary
const getStatsSummary = async (req, res, next) => {
  try {
    const total = await Application.countDocuments();

    // Aggregation for stages
    const stageCountsAgg = await Application.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
        },
      },
    ]);

    // Build map for all defined stages so count is 0 if none exist
    const byStage = {};
    STAGES.forEach((stg) => {
      byStage[stg] = 0;
    });
    stageCountsAgg.forEach((item) => {
      if (item._id) {
        byStage[item._id] = item.count;
      }
    });

    // Upcoming follow-up count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingFollowUpsCount = await Application.countDocuments({
      followUpDate: { $gte: today },
      stage: { $nin: ['Rejected', 'Offer'] },
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStage,
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
