const { body, param, validationResult } = require('express-validator');
const { STAGES } = require('../models/Application');

// Formatter to return a clear list of field errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};

// Common validation rules for both create and update
const commonRules = [
  body('stage')
    .optional()
    .isIn(STAGES)
    .withMessage(`Stage must be one of: ${STAGES.join(', ')}`),

  body('deadline')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Deadline must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('appliedDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Applied date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('followUpDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Follow-up date must be a valid ISO8601 date (YYYY-MM-DD)'),

  body('followUpNote')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Follow-up note cannot exceed 300 characters'),

  body('location')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('link')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Link cannot exceed 500 characters')
    .isURL({ require_protocol: false })
    .withMessage('Link must be a valid URL'),

  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters'),
];

// Validation rules for POST /api/applications (Create)
const createApplicationRules = [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company is required')
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ max: 100 })
    .withMessage('Role title cannot exceed 100 characters'),

  ...commonRules,
];

// Validation rules for PUT /api/applications/:id (Update)
const updateApplicationRules = [
  body('company')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company cannot be empty when provided')
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),

  body('role')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role cannot be empty when provided')
    .isLength({ max: 100 })
    .withMessage('Role title cannot exceed 100 characters'),

  ...commonRules,
];

// Validation for :id parameter (MongoDB ObjectId)
const validateObjectIdRules = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid application ID format: must be a 24-character hexadecimal ObjectId'),
];

const validateCreate = [...createApplicationRules, handleValidationErrors];
const validateUpdate = [...validateObjectIdRules, ...updateApplicationRules, handleValidationErrors];
const validateObjectId = [...validateObjectIdRules, handleValidationErrors];

module.exports = {
  validateCreate,
  validateUpdate,
  validateObjectId,
  handleValidationErrors,
};
