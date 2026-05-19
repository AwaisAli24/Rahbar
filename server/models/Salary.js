import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema(
  {
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Faculty reference is required'],
    },
    month: {
      type: String,
      required: [true, 'Month/Year is required'],
      trim: true, // e.g., "September 2025"
    },
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: [0, 'Base salary cannot be negative'],
    },
    allowance: {
      type: Number,
      default: 0,
    },
    deduction: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
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

// Pre-save middleware to calculate net salary automatically
salarySchema.pre('validate', function(next) {
  this.netSalary = (this.baseSalary || 0) + (this.allowance || 0) - (this.deduction || 0);
  next();
});

salarySchema.index({ faculty: 1, month: 1 });

const Salary = mongoose.model('Salary', salarySchema);
export default Salary;
