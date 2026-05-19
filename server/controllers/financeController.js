import Fee from '../models/Fee.js';
import Salary from '../models/Salary.js';
import User from '../models/User.js';

// ─── FEE ENDPOINTS ────────────────────────────────────────────────────────────

// @desc    Get all fee records (or filter by studentId)
// @route   GET /api/finance/fees
// @access  Private
export const getFees = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const filter = studentId ? { student: studentId } : {};

    const fees = await Fee.find(filter)
      .populate('student', 'name email campusID department program')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: fees.length, data: fees });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate a new fee challan for a student
// @route   POST /api/finance/fees
// @access  Private/Admin
export const createFee = async (req, res, next) => {
  try {
    const { studentId, semester, amount, dueDate, remarks } = req.body;

    if (!studentId || !semester || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Missing required fee fields' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Valid student record not found' });
    }

    const fee = await Fee.create({ student: studentId, semester, amount, dueDate, remarks });
    const populatedFee = await Fee.findById(fee._id).populate('student', 'name campusID');

    res.status(201).json({ success: true, message: 'Fee challan generated', data: populatedFee });
  } catch (err) {
    next(err);
  }
};

// @desc    Update fee status (e.g., mark as Paid)
// @route   PUT /api/finance/fees/:id/status
// @access  Private/Admin
export const updateFeeStatus = async (req, res, next) => {
  try {
    const { status, paidDate, remarks } = req.body;
    const fee = await Fee.findById(req.params.id);

    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    if (status) fee.status = status;
    if (paidDate) fee.paidDate = paidDate;
    if (remarks) fee.remarks = remarks;

    // Automatically set paidDate if marking as paid without a date
    if (status === 'Paid' && !fee.paidDate) {
      fee.paidDate = new Date().toISOString().split('T')[0];
    }

    await fee.save();
    const updatedFee = await Fee.findById(fee._id).populate('student', 'name campusID');

    res.status(200).json({ success: true, message: 'Fee status updated', data: updatedFee });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a fee record
// @route   DELETE /api/finance/fees/:id
// @access  Private/Admin
export const deleteFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    await fee.deleteOne();
    res.status(200).json({ success: true, message: 'Fee record removed' });
  } catch (err) {
    next(err);
  }
};


// ─── SALARY ENDPOINTS ─────────────────────────────────────────────────────────

// @desc    Get all salary records (or filter by facultyId)
// @route   GET /api/finance/salaries
// @access  Private
export const getSalaries = async (req, res, next) => {
  try {
    const { facultyId } = req.query;
    const filter = facultyId ? { faculty: facultyId } : {};

    const salaries = await Salary.find(filter)
      .populate('faculty', 'name email campusID department designation')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: salaries.length, data: salaries });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate a new salary slip for a faculty member
// @route   POST /api/finance/salaries
// @access  Private/Admin
export const createSalary = async (req, res, next) => {
  try {
    const { facultyId, month, baseSalary, allowance, deduction, remarks } = req.body;

    if (!facultyId || !month || baseSalary === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required salary fields' });
    }

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ success: false, message: 'Valid faculty record not found' });
    }

    const salary = await Salary.create({
      faculty: facultyId, month, baseSalary, allowance, deduction, remarks
    });
    
    const populatedSalary = await Salary.findById(salary._id).populate('faculty', 'name campusID');

    res.status(201).json({ success: true, message: 'Salary slip generated', data: populatedSalary });
  } catch (err) {
    next(err);
  }
};

// @desc    Update salary status (e.g., mark as Paid)
// @route   PUT /api/finance/salaries/:id/status
// @access  Private/Admin
export const updateSalaryStatus = async (req, res, next) => {
  try {
    const { status, paidDate, remarks } = req.body;
    const salary = await Salary.findById(req.params.id);

    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });

    if (status) salary.status = status;
    if (paidDate) salary.paidDate = paidDate;
    if (remarks) salary.remarks = remarks;

    // Automatically set paidDate if marking as paid without a date
    if (status === 'Paid' && !salary.paidDate) {
      salary.paidDate = new Date().toISOString().split('T')[0];
    }

    await salary.save();
    const updatedSalary = await Salary.findById(salary._id).populate('faculty', 'name campusID');

    res.status(200).json({ success: true, message: 'Salary status updated', data: updatedSalary });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a salary record
// @route   DELETE /api/finance/salaries/:id
// @access  Private/Admin
export const deleteSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found' });

    await salary.deleteOne();
    res.status(200).json({ success: true, message: 'Salary record removed' });
  } catch (err) {
    next(err);
  }
};
