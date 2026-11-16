const mongoose = require('mongoose');

const STAGES = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

const applicationSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role/position title is required'],
      trim: true,
    },
    stage: {
      type: String,
      enum: {
        values: STAGES,
        message: '{VALUE} is not a valid stage. Allowed stages: ' + STAGES.join(', '),
      },
      default: 'Applied',
    },
    deadline: {
      type: Date,
      default: null,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpNote: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering
applicationSchema.index({ company: 'text', role: 'text', notes: 'text' });
applicationSchema.index({ stage: 1 });
applicationSchema.index({ followUpDate: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = {
  Application,
  STAGES,
};
