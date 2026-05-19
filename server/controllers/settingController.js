import Setting from '../models/Setting.js';

// @desc    Get global campus configuration settings
// @route   GET /api/settings
// @access  Public/Private
export const getSettings = async (_req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({}); // Initialize with defaults
    }

    res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update global campus configuration settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      Object.assign(setting, req.body);
      await setting.save();
    }

    res.status(200).json({
      success: true,
      message: 'Campus configuration updated successfully',
      data: setting,
    });
  } catch (err) {
    next(err);
  }
};
