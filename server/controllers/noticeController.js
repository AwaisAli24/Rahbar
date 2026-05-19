import Notice from '../models/Notice.js';

// @desc    Get all notices visible to the user based on role
// @route   GET /api/notices
// @access  Private
export const getNotices = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter based on audience. Admins see all.
    if (userRole === 'student') {
      query.audience = { $in: ['All', 'Students'] };
    } else if (userRole === 'faculty') {
      query.audience = { $in: ['All', 'Faculty'] };
    }

    const notices = await Notice.find(query)
      .populate('author', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private/Admin
export const createNotice = async (req, res, next) => {
  try {
    const { title, content, audience, urgency } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const notice = await Notice.create({
      title,
      content,
      audience,
      urgency,
      author: req.user._id, // Set admin as author
    });

    const populatedNotice = await Notice.findById(notice._id).populate('author', 'name role');

    res.status(201).json({ success: true, message: 'Notice published successfully', data: populatedNotice });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
export const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await notice.deleteOne();
    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (err) {
    next(err);
  }
};
