import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Helper: sign token & send response ───────────────────────────────────────
const sendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:         user._id,
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      avatar:     user.avatar,
      campusID:   user.campusID,
      department: user.department,
      program:    user.program,
      session:    user.session,
      section:    user.section,
      semester:   user.semester,
    },
  });
};

// ── @route  POST /api/auth/register ──────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { 
      name, email, password, role, campusID, department,
      fatherName, dob, gender, phone, address, session, program, semester, section 
    } = req.body;

    let finalCampusID = campusID;
    let finalEmail = email;

    // ── Auto-generate Student Roll Number and Email ──────────────────────────
    if (role === 'student') {
      if (!session || !program) {
        return res.status(400).json({ success: false, message: 'Session and Program are required for students' });
      }

      const lastStudent = await User.findOne({ session, program })
        .sort({ campusID: -1 })
        .select('campusID');

      let nextSerial = 1;
      if (lastStudent && lastStudent.campusID) {
        const parts = lastStudent.campusID.split('-');
        const lastSerial = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
      }

      const serialStr = String(nextSerial).padStart(3, '0');
      finalCampusID = `${session}-${program}-${serialStr}`;
      finalEmail = `${finalCampusID.toLowerCase()}@rahbar.edu`;
    }

    // ── Auto-generate Faculty ID and Email ────────────────────────────────────
    if (role === 'faculty') {
      if (!department) {
        return res.status(400).json({ success: false, message: 'Department is required for faculty' });
      }

      // Map department to short code (Computer Science -> CS)
      const deptCode = department.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      
      const lastFaculty = await User.findOne({ role: 'faculty', department })
        .sort({ campusID: -1 })
        .select('campusID');

      let nextSerial = 1;
      if (lastFaculty && lastFaculty.campusID) {
        const parts = lastFaculty.campusID.split('-');
        const lastSerial = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
      }

      const serialStr = String(nextSerial).padStart(3, '0');
      finalCampusID = `FAC-${deptCode}-${serialStr}`;
      finalEmail = `${finalCampusID.toLowerCase()}@rahbar.edu`;
    }

    // Check if Campus ID already exists
    const campusExists = await User.findOne({ campusID: finalCampusID });
    if (campusExists) {
      return res.status(400).json({ success: false, message: `Campus ID ${finalCampusID} is already taken` });
    }

    // Check if Email already exists
    const emailExists = await User.findOne({ email: finalEmail });
    if (emailExists) {
      return res.status(400).json({ success: false, message: `Email ${finalEmail} is already taken` });
    }

    console.log(`[AUTH] Registering ${role}: ${finalEmail} (${finalCampusID})`);

    const user = await User.create({ 
      name, 
      email: finalEmail?.trim(), 
      password, 
      role, 
      campusID: finalCampusID?.trim(), 
      department,
      fatherName, dob, gender, phone, address, session, program, semester, section
    });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── @route  POST /api/auth/login ─────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── @route  GET /api/auth/me ──────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
