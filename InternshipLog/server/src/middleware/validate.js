const { STAGES } = require('../models/Application');

const validateApplication = (req, res, next) => {
  const { company, role, stage, deadline, appliedDate, followUpDate, link } = req.body;
  const isUpdate = req.method === 'PUT' || req.method === 'PATCH';

  // For POST, company & role are required
  if (!isUpdate) {
    if (!company || typeof company !== 'string' || !company.trim()) {
      return res.status(400).json({ success: false, message: 'Company is required and cannot be empty' });
    }
    if (!role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ success: false, message: 'Role is required and cannot be empty' });
    }
  } else {
    // For update, if provided they shouldn't be empty strings
    if (company !== undefined && (!company || typeof company !== 'string' || !company.trim())) {
      return res.status(400).json({ success: false, message: 'Company cannot be empty' });
    }
    if (role !== undefined && (!role || typeof role !== 'string' || !role.trim())) {
      return res.status(400).json({ success: false, message: 'Role cannot be empty' });
    }
  }

  // Validate stage
  if (stage !== undefined && !STAGES.includes(stage)) {
    return res.status(400).json({
      success: false,
      message: `Invalid stage: '${stage}'. Allowed stages are: ${STAGES.join(', ')}`,
    });
  }

  // Validate dates if present
  const dateFields = [{ name: 'deadline', val: deadline }, { name: 'appliedDate', val: appliedDate }, { name: 'followUpDate', val: followUpDate }];
  for (const field of dateFields) {
    if (field.val) {
      const d = new Date(field.val);
      if (isNaN(d.getTime())) {
        return res.status(400).json({
          success: false,
          message: `Invalid date format for ${field.name}`,
        });
      }
    }
  }

  // Validate URL if present
  if (link && typeof link === 'string' && link.trim() !== '') {
    try {
      new URL(link.startsWith('http') ? link : `https://${link}`);
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format for link',
      });
    }
  }

  next();
};

module.exports = {
  validateApplication,
};
