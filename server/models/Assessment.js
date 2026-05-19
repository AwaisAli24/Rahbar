import mongoose from 'mongoose';

const assessmentRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Marks cannot be negative'],
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true, // e.g. "Midterm Exam", "Quiz 1"
    },
    type: {
      type: String,
      enum: ['Quiz', 'Assignment', 'Midterm', 'FinalExam', 'Project'],
      required: [true, 'Assessment type is required'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: [1, 'Total marks must be at least 1'],
    },
    weightage: {
      type: Number, // Percentage weight of the total course grade (e.g. 25%)
      required: [true, 'Weightage percentage is required'],
      min: [1, 'Weightage must be at least 1%'],
      max: [100, 'Weightage cannot exceed 100%'],
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Assessment date is required'],
    },
    records: [assessmentRecordSchema],
  },
  {
    timestamps: true,
  }
);

// Index for fast retrieval by course
assessmentSchema.index({ course: 1, date: -1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
