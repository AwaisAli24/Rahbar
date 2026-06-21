# Rahbar API Documentation

This document lists all the available endpoints, HTTP methods, inputs (headers, query parameters, URL path parameters, and request body JSON schemas), and the success responses returned by the server. 

All routes except `/api/health`, `/api/auth/login`, and the settings `GET` route require a valid JSON Web Token (JWT) in the request headers:
```http
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents
1. [Health Check](#1-health-check)
2. [Authentication & Profile](#2-authentication--profile)
3. [User Management](#3-user-management)
4. [Course Management](#4-course-management)
5. [Attendance Management](#5-attendance-management)
6. [Timetable Management](#6-timetable-management)
7. [Assessments & Grades](#7-assessments--grades)
8. [Global Settings](#8-global-settings)
9. [Campus Analytics](#9-campus-analytics)
10. [Finance (Fees & Salaries)](#10-finance-fees--salaries)
11. [Notices & Announcements](#11-notices--announcements)
12. [Predictive Risk Assessment (ML)](#12-predictive-risk-assessment-ml)

---

## 1. Health Check
* **Route file:** [healthRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/healthRoutes.js)
* **Controller:** [getHealth](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/healthController.js#L6)
* **Access:** Public

### GET `/api/health`
Confirm server and database connection status.
* **Input:** None
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Rahbar API is operational",
    "timestamp": "2026-06-16T16:37:43.000Z",
    "server": "online",
    "database": "connected",
    "environment": "development"
  }
  ```

---

## 2. Authentication & Profile
* **Route file:** [authRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/authRoutes.js)
* **Controller:** [authController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/authController.js)

### POST `/api/auth/register`
* **Controller Function:** [register](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/authController.js#L33)
* **Access:** Private (Admin Only)
* **Input (JSON Body):**
  ```json
  {
    "name": "Full Name",
    "email": "student_or_faculty_email@domain.com", 
    "password": "Password123",
    "role": "student", 
    "campusID": "2024-CS-001", 
    "department": "Computer Science", 
    "fatherName": "Father Name",
    "dob": "1999-01-01",
    "gender": "Male", 
    "phone": "03001234567",
    "address": "Address info",
    "session": "2022", 
    "program": "CS", 
    "semester": 1,
    "section": "A"
  }
  ```
  > [!NOTE]
  > For the `student` and `faculty` roles, emails and campus IDs are auto-generated based on the session/program/department configurations if not provided.
* **Success Output (201 Created):**
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN_STRING",
    "user": {
      "id": "647f1...",
      "_id": "647f1...",
      "name": "Full Name",
      "email": "2022-cs-001@rahbar.edu",
      "role": "student",
      "avatar": "...",
      "campusID": "2022-CS-001",
      "department": "Computer Science",
      "program": "CS",
      "session": "2022",
      "section": "A",
      "semester": 1
    }
  }
  ```

### POST `/api/auth/login`
* **Controller Function:** [login](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/authController.js#L121)
* **Access:** Public
* **Input (JSON Body):**
  ```json
  {
    "email": "student@rahbar.edu",
    "password": "password123"
  }
  ```
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "token": "JWT_TOKEN_STRING",
    "user": {
      "id": "647f1...",
      "name": "Full Name",
      "email": "student@rahbar.edu",
      "role": "student",
      "campusID": "2022-CS-001"
      // ...other user fields
    }
  }
  ```

### GET `/api/auth/me`
* **Controller Function:** [getMe](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/authController.js#L149)
* **Access:** Private (Authenticated User)
* **Input:** None
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "_id": "647f1...",
      "name": "Full Name",
      "email": "student@rahbar.edu",
      "role": "student",
      "campusID": "2022-CS-001",
      "isActive": true
      // ...full user object details
    }
  }
  ```

---

## 3. User Management
* **Route file:** [userRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/userRoutes.js)
* **Controller:** [userController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/userController.js)
* **Access:** Private (Admin Only)

### GET `/api/users`
* **Controller Function:** [getUsers](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/userController.js#L7)
* **Query Params (Optional):**
  * `role` (e.g. `student`, `faculty`, `admin`) - Filters user records by role.
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "647f1...",
        "name": "User Name",
        "email": "user@rahbar.edu",
        "role": "student",
        "campusID": "2022-CS-001"
      }
    ]
  }
  ```

### GET `/api/users/stats`
* **Controller Function:** [getUserStats](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/userController.js#L27)
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "stats": {
      "students": 120,
      "faculty": 15,
      "courses": 8
    }
  }
  ```

### DELETE `/api/users/:id`
* **Controller Function:** [deleteUser](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/userController.js#L49)
* **Path Params:**
  * `id`: MongoDB User ID to delete
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "User removed"
  }
  ```

---

## 4. Course Management
* **Route file:** [courseRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/courseRoutes.js)
* **Controller:** [courseController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/courseController.js)

### GET `/api/courses`
* **Controller Function:** [getCourses](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/courseController.js#L33)
* **Access:** Private (Authenticated User)
* **Query Params (Optional):**
  * `department`: filter by department (e.g., `"Computer Science"`)
  * `studentId`: filter courses containing student ID
  * `facultyId`: filter courses taught by faculty ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "647e3...",
        "title": "Introduction to Database Systems",
        "code": "CS-204",
        "creditHours": 4,
        "department": "Computer Science",
        "faculty": {
          "_id": "647f1...",
          "name": "Dr. Sarah",
          "email": "sarah@rahbar.edu",
          "designation": "Assistant Professor"
        },
        "students": [
          {
            "_id": "647f2...",
            "name": "Student A",
            "campusID": "2022-CS-001"
          }
        ]
      }
    ]
  }
  ```

### GET `/api/courses/:id`
* **Controller Function:** [getCourse](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/courseController.js#L55)
* **Access:** Private (Authenticated User)
* **Path Params:**
  * `id`: Course Database ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "647e3...",
      "title": "Introduction to Database Systems",
      "code": "CS-204",
      "creditHours": 4,
      // ...populated faculty and student lists
    }
  }
  ```

### POST `/api/courses`
* **Controller Function:** [createCourse](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/courseController.js#L6)
* **Access:** Private (Admin Only)
* **Input (JSON Body):**
  ```json
  {
    "title": "Introduction to Database Systems",
    "code": "CS-204",
    "creditHours": 4,
    "department": "Computer Science",
    "faculty": "647f1...", 
    "description": "Fundamental database concepts."
  }
  ```
* **Success Output (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "647e3...",
      "title": "Introduction to Database Systems",
      "code": "CS-204",
      "creditHours": 4,
      "department": "Computer Science",
      "faculty": "647f1...",
      "description": "Fundamental database concepts.",
      "students": []
    }
  }
  ```

### POST `/api/courses/:id/enroll`
* **Controller Function:** [enrollStudents](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/courseController.js#L74)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Course Database ID
* **Input (JSON Body):**
  ```json
  {
    "studentIds": ["647f2...", "647f3..."]
  }
  ```
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Students enrolled successfully"
  }
  ```

### DELETE `/api/courses/:id`
* **Controller Function:** [deleteCourse](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/courseController.js#L100)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Course ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Course removed"
  }
  ```

---

## 5. Attendance Management
* **Route file:** [attendanceRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/attendanceRoutes.js)
* **Controller:** [attendanceController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/attendanceController.js)
* **Access:** Private (Authenticated User)

### GET `/api/attendance`
Fetch attendance sheet for a course on a specific date. If it doesn't exist, it generates an initial roster populated with default `'Present'` values.
* **Controller Function:** [getAttendance](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/attendanceController.js#L7)
* **Query Params (Required):**
  * `courseId`: Course ID
  * `date`: Date in string format (e.g. `"2026-06-16"`)
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "recorded": true,
    "course": { "id": "647e3...", "title": "...", "code": "..." },
    "data": {
      "_id": "647d4...",
      "course": "647e3...",
      "date": "2026-06-16",
      "recordedBy": { "name": "Dr. Sarah", "designation": "..." },
      "records": [
        {
          "student": { "name": "Student A", "campusID": "2022-CS-001" },
          "status": "Present",
          "remarks": ""
        }
      ]
    }
  }
  ```

### POST `/api/attendance`
Mark or update attendance. Uses an upsert query to update existing dates or insert new attendance sheets.
* **Controller Function:** [markAttendance](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/attendanceController.js#L64)
* **Input (JSON Body):**
  ```json
  {
    "courseId": "647e3...",
    "date": "2026-06-16",
    "records": [
      {
        "student": "647f2...",
        "status": "Present", 
        "remarks": "On time"
      }
    ]
  }
  ```
  *(Status options: `'Present' | 'Absent' | 'Late' | 'Leave'`)*
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Attendance saved successfully",
    "data": {
      "_id": "647d4...",
      "course": "647e3...",
      "date": "2026-06-16",
      "recordedBy": "647f1...",
      "records": [...]
    }
  }
  ```

### GET `/api/attendance/summary/:courseId`
* **Controller Function:** [getAttendanceSummary](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/attendanceController.js#L97)
* **Path Params:**
  * `courseId`: Course Database ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "totalSessions": 15,
    "summary": [
      {
        "student": { "id": "647f2...", "name": "Student A", "campusID": "2022-CS-001" },
        "present": 12,
        "absent": 1,
        "late": 2,
        "leave": 0,
        "percentage": 93
      }
    ]
  }
  ```

### GET `/api/attendance/student/:studentId`
* **Controller Function:** [getStudentAttendance](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/attendanceController.js#L155)
* **Path Params:**
  * `studentId`: Student's User ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "course": { "id": "647e3...", "title": "...", "code": "...", "creditHours": 4 },
        "present": 12,
        "absent": 1,
        "late": 2,
        "leave": 0,
        "percentage": 93,
        "totalSessions": 15
      }
    ]
  }
  ```

---

## 6. Timetable Management
* **Route file:** [timetableRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/timetableRoutes.js)
* **Controller:** [timetableController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/timetableController.js)

### GET `/api/timetable`
* **Controller Function:** [getTimetable](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/timetableController.js#L7)
* **Access:** Private (Authenticated User)
* **Query Params (Optional):**
  * `department`: filter by department (e.g., `"Computer Science"`)
  * `day`: filter by day of the week (e.g., `"Monday"`)
  * `facultyId`: filter by assigned instructor's User ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "647c2...",
        "course": {
          "_id": "647e3...",
          "title": "...",
          "code": "CS-204",
          "creditHours": 4,
          "faculty": {
            "_id": "647f1...",
            "name": "Dr. Sarah",
            "designation": "..."
          }
        },
        "day": "Monday",
        "startTime": "09:00",
        "endTime": "10:30",
        "room": "Room-301",
        "department": "Computer Science"
      }
    ]
  }
  ```

### POST `/api/timetable`
Create a slot. System automatically blocks creation if room conflicts or faculty scheduling conflicts are found.
* **Controller Function:** [createTimetableSlot](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/timetableController.js#L43)
* **Access:** Private (Admin Only)
* **Input (JSON Body):**
  ```json
  {
    "courseId": "647e3...",
    "day": "Monday",
    "startTime": "09:00",
    "endTime": "10:30",
    "room": "Room-301",
    "department": "Computer Science"
  }
  ```
* **Success Output (201 Created):**
  ```json
  {
    "success": true,
    "message": "Timetable slot created successfully",
    "data": {
      "_id": "647c2...",
      "course": { ... },
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:30",
      "room": "Room-301",
      "department": "Computer Science"
    }
  }
  ```

### DELETE `/api/timetable/:id`
* **Controller Function:** [deleteTimetableSlot](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/timetableController.js#L111)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Timetable Slot ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Timetable slot removed successfully"
  }
  ```

---

## 7. Assessments & Grades
* **Route file:** [assessmentRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/assessmentRoutes.js)
* **Controller:** [assessmentController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js)

### GET `/api/assessments`
* **Controller Function:** [getAssessments](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js#L7)
* **Access:** Private (Authenticated User)
* **Query Params (Required):**
  * `courseId`: Course Database ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "647b1...",
        "course": "647e3...",
        "title": "Quiz 1",
        "type": "Quiz",
        "totalMarks": 10,
        "weightage": 5,
        "date": "2026-06-16T00:00:00.000Z",
        "records": [
          {
            "student": { "_id": "647f2...", "name": "Student A", "campusID": "2022-CS-001" },
            "marksObtained": 8,
            "remarks": "Excellent"
          }
        ]
      }
    ]
  }
  ```

### POST `/api/assessments`
Create a new assessment. This initializes grading roster records for all students enrolled in the target course with default marks set to `0`.
* **Controller Function:** [createAssessment](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js#L31)
* **Access:** Private (Faculty / Admin)
* **Input (JSON Body):**
  ```json
  {
    "courseId": "647e3...",
    "title": "Quiz 1",
    "type": "Quiz", 
    "totalMarks": 10,
    "weightage": 5,
    "date": "2026-06-16"
  }
  ```
  *(Types options: `'Quiz' | 'Assignment' | 'Midterm' | 'Final'`)*
* **Success Output (201 Created):**
  ```json
  {
    "success": true,
    "message": "Assessment created successfully",
    "data": { ... }
  }
  ```

### PUT `/api/assessments/:id/marks`
Update grade marks for one or more students.
* **Controller Function:** [updateMarks](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js#L77)
* **Access:** Private (Faculty / Admin)
* **Path Params:**
  * `id`: Assessment ID
* **Input (JSON Body):**
  ```json
  {
    "records": [
      {
        "studentId": "647f2...",
        "marksObtained": 9.5,
        "remarks": "Very creative solution"
      }
    ]
  }
  ```
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Marks updated successfully",
    "data": { ... }
  }
  ```

### DELETE `/api/assessments/:id`
* **Controller Function:** [deleteAssessment](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js#L115)
* **Access:** Private (Faculty / Admin)
* **Path Params:**
  * `id`: Assessment ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Assessment removed successfully"
  }
  ```

### GET `/api/assessments/gradebook/:courseId`
Calculates cumulative weighted grades for all students in a course, converting them to GPA/Letter Grades.
* **Controller Function:** [getGradebookSummary](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js#L145)
* **Access:** Private (Authenticated User)
* **Path Params:**
  * `courseId`: Course ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "totalWeightageConfigured": 25,
    "data": [
      {
        "student": { "id": "647f2...", "name": "Student A", "campusID": "2022-CS-001" },
        "assessments": [
          {
            "assessmentId": "647b1...",
            "title": "Quiz 1",
            "type": "Quiz",
            "totalMarks": 10,
            "weightage": 5,
            "marksObtained": 8,
            "weightedMarks": 4
          }
        ],
        "cumulativeScore": 82.5,
        "grade": "A-",
        "gpa": 3.7
      }
    ]
  }
  ```

### GET `/api/assessments/student/:studentId`
Calculates grade summaries for all courses a specific student is enrolled in.
* **Controller Function:** [getStudentGrades](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/assessmentController.js#L205)
* **Access:** Private (Authenticated User)
* **Path Params:**
  * `studentId`: Student ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "course": { "id": "647e3...", "title": "...", "code": "CS-204", "creditHours": 4 },
        "assessments": [...],
        "cumulativeScore": 82.5,
        "grade": "A-",
        "gpa": 3.7
      }
    ]
  }
  ```

---

## 8. Global Settings
* **Route file:** [settingRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/settingRoutes.js)
* **Controller:** [settingController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/settingController.js)

### GET `/api/settings`
* **Controller Function:** [getSettings](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/settingController.js#L6)
* **Access:** Public / Private
* **Input:** None
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "647a1...",
      "campusName": "Rahbar University",
      "semesterStatus": "Fall 2026",
      "attendanceThreshold": 75
    }
  }
  ```

### PUT `/api/settings`
* **Controller Function:** [updateSettings](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/settingController.js#L25)
* **Access:** Private (Admin Only)
* **Input (JSON Body):** Fields to modify.
  ```json
  {
    "campusName": "Rahbar Institute of Science & Technology",
    "semesterStatus": "Spring 2027",
    "attendanceThreshold": 80
  }
  ```
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Campus configuration updated successfully",
    "data": { ... }
  }
  ```

---

## 9. Campus Analytics
* **Route file:** [analyticsRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/analyticsRoutes.js)
* **Controller:** [getAnalytics](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/analyticsController.js#L9)
* **Access:** Private (Admin Only)

### GET `/api/analytics`
Fetches high-level metrics and aggregated chart distributions.
* **Input:** None
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "kpis": {
        "totalStudents": 120,
        "totalFaculty": 15,
        "activeCourses": 8,
        "totalAssessments": 25
      },
      "charts": {
        "departmentStudents": [
          { "name": "CS", "students": 60 }
        ],
        "facultyDesignations": [
          { "designation": "Lecturer", "count": 8 }
        ]
      },
      "activity": [
        {
          "id": "647b1...",
          "type": "assessment",
          "title": "New Quiz published for CS-204",
          "timestamp": "2026-06-16T12:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## 10. Finance (Fees & Salaries)
* **Route file:** [financeRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/financeRoutes.js)
* **Controller:** [financeController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js)

### GET `/api/finance/fees`
* **Controller Function:** [getFees](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L10)
* **Access:** Private (Students view theirs, Admin views all)
* **Query Params (Optional):**
  * `studentId`: Filter records by student ID.
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "64791...",
        "student": { "_id": "647f2...", "name": "Student A", "campusID": "2022-CS-001" },
        "semester": 1,
        "amount": 45000,
        "status": "Unpaid",
        "dueDate": "2026-07-01T00:00:00.000Z",
        "paidDate": null,
        "remarks": "Tuition Fee"
      }
    ]
  }
  ```

### POST `/api/finance/fees`
* **Controller Function:** [createFee](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L28)
* **Access:** Private (Admin Only)
* **Input (JSON Body):**
  ```json
  {
    "studentId": "647f2...",
    "semester": 1,
    "amount": 45000,
    "dueDate": "2026-07-01",
    "remarks": "Tuition Fee"
  }
  ```
* **Success Output (210 Created):**
  ```json
  {
    "success": true,
    "message": "Fee challan generated",
    "data": { ... }
  }
  ```

### PUT `/api/finance/fees/:id/status`
Update fee status (e.g. mark Paid).
* **Controller Function:** [updateFeeStatus](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L53)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Fee Record ID
* **Input (JSON Body):**
  ```json
  {
    "status": "Paid", 
    "paidDate": "2026-06-16", 
    "remarks": "Paid via Bank App"
  }
  ```
  *(Status options: `'Unpaid' | 'Paid' | 'Overdue'`)*
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Fee status updated",
    "data": { ... }
  }
  ```

### DELETE `/api/finance/fees/:id`
* **Controller Function:** [deleteFee](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L81)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Fee Record ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Fee record removed"
  }
  ```

### GET `/api/finance/salaries`
* **Controller Function:** [getSalaries](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L99)
* **Access:** Private (Faculty view theirs, Admin views all)
* **Query Params (Optional):**
  * `facultyId`: Filter records by faculty ID.
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "64792...",
        "faculty": { "_id": "647f1...", "name": "Dr. Sarah" },
        "month": "June 2026",
        "baseSalary": 120000,
        "allowance": 15000,
        "deduction": 5000,
        "netSalary": 130000,
        "status": "Paid",
        "paidDate": "2026-06-16"
      }
    ]
  }
  ```

### POST `/api/finance/salaries`
* **Controller Function:** [createSalary](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L117)
* **Access:** Private (Admin Only)
* **Input (JSON Body):**
  ```json
  {
    "facultyId": "647f1...",
    "month": "June 2026",
    "baseSalary": 120000,
    "allowance": 15000,
    "deduction": 5000,
    "remarks": "Regular pay"
  }
  ```
* **Success Output (201 Created):**
  ```json
  {
    "success": true,
    "message": "Salary slip generated",
    "data": { ... }
  }
  ```

### PUT `/api/finance/salaries/:id/status`
* **Controller Function:** [updateSalaryStatus](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L145)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Salary Record ID
* **Input (JSON Body):**
  ```json
  {
    "status": "Paid",
    "paidDate": "2026-06-16",
    "remarks": "Bank Transfer Complete"
  }
  ```
  *(Status options: `'Unpaid' | 'Paid'`)*
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Salary status updated",
    "data": { ... }
  }
  ```

### DELETE `/api/finance/salaries/:id`
* **Controller Function:** [deleteSalary](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/financeController.js#L173)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Salary Record ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Salary record removed"
  }
  ```

---

## 11. Notices & Announcements
* **Route file:** [noticeRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/noticeRoutes.js)
* **Controller:** [noticeController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/noticeController.js)

### GET `/api/notices`
* **Controller Function:** [getNotices](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/noticeController.js#L6)
* **Access:** Private (Authenticated User)
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "64781...",
        "title": "Semester Registration Extended",
        "content": "Deadline is now June 30.",
        "audience": "Students",
        "urgency": "High",
        "author": { "_id": "647fa...", "name": "Admin", "role": "admin" }
      }
    ]
  }
  ```

### POST `/api/notices`
* **Controller Function:** [createNotice](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/noticeController.js#L31)
* **Access:** Private (Admin Only)
* **Input (JSON Body):**
  ```json
  {
    "title": "Semester Registration Extended",
    "content": "Deadline is now June 30.",
    "audience": "Students", 
    "urgency": "High" 
  }
  ```
  *(Audience: `'All' | 'Students' | 'Faculty'`. Urgency: `'Low' | 'Medium' | 'High'`)*
* **Success Output (210 Created):**
  ```json
  {
    "success": true,
    "message": "Notice published successfully",
    "data": { ... }
  }
  ```

### DELETE `/api/notices/:id`
* **Controller Function:** [deleteNotice](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/noticeController.js#L58)
* **Access:** Private (Admin Only)
* **Path Params:**
  * `id`: Notice Database ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "message": "Notice deleted successfully"
  }
  ```

---

## 12. Predictive Risk Assessment (ML)
* **Route file:** [predictionRoutes.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/routes/predictionRoutes.js)
* **Controller:** [predictionController.js](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/predictionController.js)

### GET `/api/predictions/dashboard`
Fetches students classified as "At-Risk" (Moderate, High, Critical Risk) using computed features from student attendance and assessment averages.
* **Controller Function:** [getAtRiskDashboard](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/predictionController.js#L153)
* **Access:** Private (Faculty / Admin Only)
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "stats": {
      "totalStudents": 120,
      "totalAtRisk": 15,
      "criticalCount": 2,
      "highCount": 5,
      "moderateCount": 8
    },
    "data": [
      {
        "_id": "647f2...",
        "name": "Student A",
        "campusID": "2022-CS-001",
        "department": "Computer Science",
        "program": "CS",
        "features": {
          "attendance_rate": 62.5,
          "quiz_avg": 55.4,
          "assignment_avg": 60.1,
          "midterm_score": 52,
          "base_cgpa": 3
        },
        "prediction": {
          "success": true,
          "prediction": 0,
          "fail_probability": 0.68,
          "risk_percentage": 68,
          "risk_status": "High Risk"
        }
      }
    ]
  }
  ```

### GET `/api/predictions/student/:studentId`
Query details for a single student.
* **Controller Function:** [getStudentRiskDetails](file:///Users/awaisali/Desktop/FYP/Rahbar/server/controllers/predictionController.js#L128)
* **Access:** Private (Authenticated User)
* **Path Params:**
  * `studentId`: Student Database ID
* **Success Output (200 OK):**
  ```json
  {
    "success": true,
    "student": {
      "_id": "647f2...",
      "name": "Student A",
      "campusID": "2022-CS-001",
      "department": "Computer Science",
      "program": "CS",
      "role": "student"
    },
    "features": {
      "attendance_rate": 62.5,
      "quiz_avg": 55.4,
      "assignment_avg": 60.1,
      "midterm_score": 52,
      "base_cgpa": 3
    },
    "prediction": {
      "success": true,
      "prediction": 0,
      "fail_probability": 0.68,
      "risk_status": "High Risk"
    }
  }
  ```
