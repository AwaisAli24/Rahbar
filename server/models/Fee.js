import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true, // e.g., "Fall 2025"
    },
    amount: {
      type: Number,
      required: [true, 'Fee amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      required: [true, 'Due date is required'],
    },
    status: {
      type: String,
      enum: ['Unpaid', 'Paid', 'Overdue'],
      default: 'Unpaid',
    },
    paidDate: {
      type: String, // YYYY-MM-DD
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for faster retrieval by student and status
feeSchema.index({ student: 1, status: 1 });

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
