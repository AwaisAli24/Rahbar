import User from '../models/User.js';
import Course from '../models/Course.js';
import fs from 'fs';
import path from 'path';

// @desc    Get all users (with optional role filter)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user counts for badges
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res, next) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const facultyCount = await User.countDocuments({ role: 'faculty' });
    const courseCount = await Course.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      stats: {
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (editable fields only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const allowed = ['name', 'fatherName', 'phone', 'address', 'gender', 'dob', 'semester', 'section', 'isActive', 'profilePicture', 'designation', 'specialization', 'cgpa', 'concessionType'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Validation for student concessions
    const finalConcessionType = updates.concessionType !== undefined ? updates.concessionType : userToUpdate.concessionType;
    const finalCgpa = updates.cgpa !== undefined ? Number(updates.cgpa) : userToUpdate.cgpa;

    if (finalConcessionType === 'academic_merit' && finalCgpa < 3.5) {
      return res.status(400).json({ success: false, message: 'Academic Merit concession requires a CGPA of 3.5 or higher.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User removed',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload / replace student profile picture
// @route   POST /api/users/:id/photo
// @access  Private/Admin
export const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete old picture if exists
    if (user.profilePicture) {
      const old = path.join(process.cwd(), 'uploads', 'profiles', user.profilePicture);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    user.profilePicture = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated',
      data: { profilePicture: req.file.filename },
    });
  } catch (err) {
    next(err);
  }
};
