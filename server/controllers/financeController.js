import Fee from '../models/Fee.js';
import Salary from '../models/Salary.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

// ─── FEE ENDPOINTS ────────────────────────────────────────────────────────────

// @desc    Get all fee records (or filter by studentId)
// @route   GET /api/finance/fees
// @access  Private
export const getFees = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const filter = studentId ? { student: studentId } : {};

    const fees = await Fee.find(filter)
      .populate('student', 'name email campusID department program concessionType cgpa')
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

    const baseAmount = Number(amount);
    let finalAmount = baseAmount;
    let discountAmount = 0;
    const concessionType = student.concessionType || 'none';

    if (concessionType === 'old_student') {
      discountAmount = Math.round(baseAmount * 0.25);
      finalAmount = baseAmount - discountAmount;
    } else if (concessionType === 'academic_merit' && student.cgpa >= 3.5) {
      discountAmount = Math.round(baseAmount * 0.50);
      finalAmount = baseAmount - discountAmount;
    }

    const fee = await Fee.create({ 
      student: studentId, 
      semester, 
      originalAmount: baseAmount,
      concessionType,
      discountAmount,
      amount: finalAmount, 
      dueDate, 
      remarks 
    });
    const populatedFee = await Fee.findById(fee._id).populate('student', 'name campusID department concessionType cgpa');

    res.status(201).json({ success: true, message: 'Fee challan generated', data: populatedFee });
  } catch (err) {
    next(err);
  }
};

// @desc    Auto-generate fee challans based on each student's enrolled courses + credit hours
// @route   POST /api/finance/fees/auto
// @access  Private/Admin
export const autoGenerateFees = async (req, res, next) => {
  try {
    const { semester, dueDate, department } = req.body;

    if (!semester || !dueDate) {
      return res.status(400).json({ success: false, message: 'Semester and due date are required' });
    }

    // Credit hours → fee rate mapping
    const RATE = { 1: 2000, 2: 3000, 3: 5000, 4: 5000 };

    // Fetch all courses (optionally filtered by department)
    const courseFilter = department ? { department } : {};
    const courses = await Course.find(courseFilter).select('creditHours students title code');

    if (courses.length === 0) {
      return res.status(404).json({ success: false, message: 'No courses found' });
    }

    // Fetch all active students to read their concessionType
    const studentsList = await User.find({ role: 'student' }).select('_id concessionType cgpa');
    const studentMap = {};
    studentsList.forEach(s => {
      studentMap[s._id.toString()] = s;
    });

    // Build a map: studentId → total fee amount
    const studentFeeMap = {};
    const studentCourseMap = {}; // for remarks

    courses.forEach(course => {
      const rate = RATE[course.creditHours] || 5000;
      course.students.forEach(studentId => {
        const sid = studentId.toString();
        studentFeeMap[sid] = (studentFeeMap[sid] || 0) + rate;
        if (!studentCourseMap[sid]) studentCourseMap[sid] = [];
        studentCourseMap[sid].push(`${course.code}(${course.creditHours}cr=PKR${rate})`);
      });
    });

    if (Object.keys(studentFeeMap).length === 0) {
      return res.status(404).json({ success: false, message: 'No students are enrolled in any courses' });
    }

    // Build fee records with concession rules applied
    const feeRecords = Object.entries(studentFeeMap).map(([studentId, baseAmount]) => {
      const studentObj = studentMap[studentId];
      let finalAmount = baseAmount;
      let concessionRemarks = '';
      let discountAmount = 0;
      const concessionType = studentObj ? (studentObj.concessionType || 'none') : 'none';

      if (studentObj) {
        if (concessionType === 'old_student') {
          discountAmount = Math.round(baseAmount * 0.25); // 25% off
          finalAmount = baseAmount - discountAmount;
          concessionRemarks = ' [25% Old Student Concession Applied]';
        } else if (concessionType === 'academic_merit' && studentObj.cgpa >= 3.5) {
          discountAmount = Math.round(baseAmount * 0.50); // 50% off
          finalAmount = baseAmount - discountAmount;
          concessionRemarks = ' [50% Academic Merit Concession Applied]';
        }
      }

      return {
        student: studentId,
        semester,
        originalAmount: baseAmount,
        concessionType,
        discountAmount,
        amount: finalAmount,
        dueDate,
        remarks: `Auto-generated: ${studentCourseMap[studentId].join(', ')}${concessionRemarks}`
      };
    });

    const createdFees = await Fee.insertMany(feeRecords);

    res.status(201).json({
      success: true,
      message: `Auto-generated ${createdFees.length} fee challans based on course enrollments`,
      count: createdFees.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate bulk fee challans for all students in a department (fixed amount)
// @route   POST /api/finance/fees/bulk
// @access  Private/Admin
export const createBulkFees = async (req, res, next) => {
  try {
    const { department, semester, amount, dueDate, remarks } = req.body;

    if (!department || !semester || !amount || !dueDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields for bulk generation' });
    }

    const students = await User.find({ role: 'student', department });
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: `No students found in ${department}` });
    }

    const baseAmount = Number(amount);
    const feeRecords = students.map(student => {
      let finalAmount = baseAmount;
      let discountAmount = 0;
      const concessionType = student.concessionType || 'none';

      if (concessionType === 'old_student') {
        discountAmount = Math.round(baseAmount * 0.25);
        finalAmount = baseAmount - discountAmount;
      } else if (concessionType === 'academic_merit' && student.cgpa >= 3.5) {
        discountAmount = Math.round(baseAmount * 0.50);
        finalAmount = baseAmount - discountAmount;
      }

      return {
        student: student._id,
        semester,
        originalAmount: baseAmount,
        concessionType,
        discountAmount,
        amount: finalAmount,
        dueDate,
        remarks: remarks || ''
      };
    });

    const createdFees = await Fee.insertMany(feeRecords);

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdFees.length} challans for ${department}`,
      count: createdFees.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update fee details (general editing)
// @route   PUT /api/finance/fees/:id
// @access  Private/Admin
export const updateFee = async (req, res, next) => {
  try {
    const { semester, amount, dueDate, status, remarks, paidDate } = req.body;
    const fee = await Fee.findById(req.params.id);

    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    if (semester !== undefined) fee.semester = semester;
    if (amount !== undefined) fee.amount = amount;
    if (dueDate !== undefined) fee.dueDate = dueDate;
    if (status !== undefined) fee.status = status;
    if (remarks !== undefined) fee.remarks = remarks;
    if (paidDate !== undefined) fee.paidDate = paidDate;

    // Automatically adjust paidDate if marking paid
    if (status === 'Paid' && !fee.paidDate) {
      fee.paidDate = new Date().toISOString().split('T')[0];
    } else if (status !== 'Paid') {
      fee.paidDate = undefined;
    }

    await fee.save();
    const updatedFee = await Fee.findById(fee._id).populate('student', 'name email campusID department program');

    res.status(200).json({ success: true, message: 'Fee record updated successfully', data: updatedFee });
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
