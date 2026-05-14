"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// List all students
router.get('/', async (req, res) => {
    try {
        const students = await database_1.prisma.student.findMany({
            include: {
                group: true
            },
            orderBy: {
                fullName: 'asc'
            }
        });
        res.json(students);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});
// Get single student
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const student = await database_1.prisma.student.findUnique({
            where: { id },
            include: {
                group: true,
                guardians: {
                    include: {
                        guardian: true
                    }
                }
            }
        });
        if (!student)
            return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});
// Create student
const createStudentSchema = zod_1.z.object({
    fullName: zod_1.z.string(),
    birthDate: zod_1.z.string().transform(str => new Date(str)),
    schoolId: zod_1.z.string(),
    groupId: zod_1.z.string().optional(),
    shift: zod_1.z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
});
router.post('/', async (req, res) => {
    try {
        const data = createStudentSchema.parse(req.body);
        const student = await database_1.prisma.student.create({
            data
        });
        res.status(201).json(student);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json(error.errors);
        res.status(500).json({ error: 'Failed to create student' });
    }
});
exports.default = router;
