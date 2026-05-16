import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Leave'],
    default: 'Present',
    required: true,
  },
  remarks: {
    type: String,
    trim: true,
  },
}, { _id: false });

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for precise querying and avoiding timezone shifts
      required: [true, 'Date is required'],
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorded by user reference is required'],
    },
    records: [attendanceRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Ensure only one attendance sheet per course per day
attendanceSchema.index({ course: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
