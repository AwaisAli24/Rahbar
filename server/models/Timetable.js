import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: [true, 'Day of week is required'],
    },
    startTime: {
      type: String, // e.g. "08:30"
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String, // e.g. "10:00"
      required: [true, 'End time is required'],
      trim: true,
    },
    room: {
      type: String, // e.g. "Room 101", "Lab 3"
      required: [true, 'Room/Venue is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help detect room conflicts quickly
timetableSchema.index({ day: 1, startTime: 1, room: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
