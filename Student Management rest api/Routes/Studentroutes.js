const express = require("express");
const router = express.Router();
const students = require("../data/students");

// GET /students - return all students.
router.get("/", (req, res) => {
    res.status(200).json(students);
});

// GET /students/:id - return one student by ID.
router.get("/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Student ID must be a positive integer" });
    }

    const student = students.find((item) => item.id === id);

    if (!student) {
        return res.status(404).json({ error: "Student not found" });
    }

    res.status(200).json(student);
});

// POST /students - create a student.
router.post("/", (req, res) => {
    const { name, course } = req.body || {};

    if (
        typeof name !== "string" || name.trim() === "" ||
        typeof course !== "string" || course.trim() === ""
    ) {
        return res.status(400).json({
            error: "Both name and course are required as non-empty strings"
        });
    }

    const nextId = students.length
        ? Math.max(...students.map((student) => student.id)) + 1
        : 1;

    const newStudent = {
        id: nextId,
        name: name.trim(),
        course: course.trim()
    };

    students.push(newStudent);
    res.status(201).json(newStudent);
});

// PUT /students/:id - update a student's name and/or course.
router.put("/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Student ID must be a positive integer" });
    }

    const student = students.find((item) => item.id === id);

    if (!student) {
        return res.status(404).json({ error: "Student not found" });
    }

    const { name, course } = req.body || {};
    const hasName = Object.prototype.hasOwnProperty.call(req.body || {}, "name");
    const hasCourse = Object.prototype.hasOwnProperty.call(req.body || {}, "course");

    if (!hasName && !hasCourse) {
        return res.status(400).json({
            error: "Provide name and/or course to update"
        });
    }

    if (hasName && (typeof name !== "string" || name.trim() === "")) {
        return res.status(400).json({ error: "Name must be a non-empty string" });
    }

    if (hasCourse && (typeof course !== "string" || course.trim() === "")) {
        return res.status(400).json({ error: "Course must be a non-empty string" });
    }

    if (hasName) student.name = name.trim();
    if (hasCourse) student.course = course.trim();

    res.status(200).json(student);
});

// DELETE /students/:id - delete a student.
router.delete("/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Student ID must be a positive integer" });
    }

    const index = students.findIndex((item) => item.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Student not found" });
    }

    const deletedStudent = students.splice(index, 1)[0];

    res.status(200).json({
        message: "Student deleted successfully",
        student: deletedStudent
    });
});

module.exports = router;
