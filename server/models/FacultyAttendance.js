import mongoose from 'mongoose';

const facultyAttendanceSchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date is required'],
    },
    startTime: {
      type: Date, // Full ISO timestamp when class started
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date, // Full ISO timestamp when class ended (null if still active)
      default: null,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      default: 'Present',
    },
    sessionActive: {
      type: Boolean,
      default: true, // true = class ongoing, false = class ended
    },
  },
  {
    timestamps: true,
  }
);

// One session per faculty per course per day
facultyAttendanceSchema.index({ faculty: 1, course: 1, date: 1 }, { unique: true });

const FacultyAttendance = mongoose.model('FacultyAttendance', facultyAttendanceSchema);
export default FacultyAttendance;
