const express = require('express');
const router = express.Router();
const Student = require('../models/student.model');

// Get all students (Admin)
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific student (Student Profile / Admin View)
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new student (Admin)
router.post('/students', async (req, res) => {
  const student = new Student(req.body);
  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seed data for demonstration
router.post('/seed', async (req, res) => {
  try {
    await Student.deleteMany({});
    const mockStudents = [
      {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        skills: [{ name: 'Javascript', level: 85 }, { name: 'React', level: 70 }],
        performance: [
          { category: 'Coding', score: 90, notes: 'Excellent logic' },
          { category: 'Aptitude', score: 75, notes: 'Good progress' }
        ]
      },
      {
        name: 'Samantha Reed',
        email: 'sam@example.com',
        skills: [{ name: 'Python', level: 90 }, { name: 'Data Analysis', level: 80 }],
        performance: [
          { category: 'Coding', score: 95, notes: 'Top of class' },
          { category: 'Communication', score: 85, notes: 'Very vocal' }
        ]
      }
    ];
    await Student.insertMany(mockStudents);
    res.json({ message: 'Database seeded with mock students' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
