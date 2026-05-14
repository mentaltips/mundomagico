"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const [totalStudents, totalChildren, totalGroups] = await Promise.all([
            database_1.prisma.student.count(),
            database_1.prisma.child.count(),
            database_1.prisma.group.count()
        ]);
        res.json({
            totalStudents: totalStudents + totalChildren,
            totalGroups,
            activeAlunos: totalStudents + totalChildren, // for now
            pendingInvoices: 12, // mocked for now
            attendanceRate: '94%' // mocked for now
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
exports.default = router;
