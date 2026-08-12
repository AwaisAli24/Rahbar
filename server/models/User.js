import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    campusID: {
      type: String,
      required: [true, 'Campus ID is required'],
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // ── Student Specific Fields ──────────────────────────────────────────────
    fatherName: String,
    dob: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: String,
    address: String,
    session: String,   // e.g., FA24
    program: String,   // e.g., BCS
    semester: { type: Number, default: 1 },
    section: { type: String, uppercase: true },
    profilePicture: { type: String, default: null }, // stored filename
    cgpa: { type: Number, default: 0.0 },
    concessionType: { type: String, enum: ['none', 'old_student', 'academic_merit'], default: 'none' },
    
    // ── Faculty Specific Fields ──────────────────────────────────────────────
    designation: String,
    specialization: String,
  },
  {
    timestamps: true,
  }
);

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Instance method: get JWT ──────────────────────────────────────────────────
userSchema.methods.getSignedToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const User = mongoose.model('User', userSchema);
export default User;
