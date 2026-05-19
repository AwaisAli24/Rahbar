import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    universityName: {
      type: String,
      required: true,
      default: 'Rahbar Smart Campus',
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: '2025-2026',
      trim: true,
    },
    currentSemester: {
      type: String,
      required: true,
      default: 'Fall 2025',
      trim: true,
    },
    semesterStartDate: {
      type: String,
      required: true,
      default: '2025-09-01',
    },
    semesterEndDate: {
      type: String,
      required: true,
      default: '2026-01-15',
    },
    attendanceThreshold: {
      type: Number,
      required: true,
      default: 75,
      min: [50, 'Minimum threshold cannot be lower than 50%'],
      max: [100, 'Threshold cannot exceed 100%'],
    },
    maxCreditHoursPerSemester: {
      type: Number,
      required: true,
      default: 18,
      min: [3, 'Minimum credit hours must be at least 3'],
      max: [24, 'Maximum credit hours cannot exceed 24'],
    },
    gradingScale: {
      type: String,
      enum: ['Absolute', 'Relative'],
      required: true,
      default: 'Absolute',
    },
    allowStudentEnrollment: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowFacultyGrading: {
      type: Boolean,
      required: true,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      required: true,
      default: false,
    },
    contactEmail: {
      type: String,
      required: true,
      default: 'admin@rahbar.edu',
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      default: '+1 (555) 123-4567',
      trim: true,
    },
    address: {
      type: String,
      required: true,
      default: '100 Smart Campus Blvd, Tech City',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
