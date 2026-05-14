"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET /dashboard - Teacher dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const groups = await database_1.prisma.group.findMany({
            where: { schoolId, active: true },
            include: {
                _count: { select: { children: true, students: true } }
            }
        });
        const todayCheckIns = await database_1.prisma.childCheckInOut.findMany({
            where: { schoolId, date: { gte: today, lte: todayEnd } },
            include: { child: { select: { id: true, fullName: true } } }
        });
        const pendingReports = await database_1.prisma.childDailyReport.count({
            where: { schoolId, isDraft: true, date: { gte: today, lte: todayEnd } }
        });
        const announcements = await database_1.prisma.announcement.findMany({
            where: {
                schoolId,
                OR: [{ targetRole: 'TEACHER' }, { targetRole: 'CAREGIVER' }, { targetRole: null }]
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        res.json({ groups, todayCheckIns, pendingReports, announcements });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /classes - List classes (groups) for this school
router.get('/classes', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const classes = await database_1.prisma.group.findMany({
            where: { schoolId, active: true },
            include: {
                children: {
                    select: { id: true, fullName: true, photoUrl: true, status: true }
                },
                students: {
                    select: { id: true, fullName: true, photoUrl: true, status: true }
                },
                _count: { select: { children: true, students: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.json(classes);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /classes/:id - Get class details
router.get('/classes/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const group = await database_1.prisma.group.findFirst({
            where: { id: req.params.id, schoolId },
            include: {
                children: {
                    where: { status: 'ATIVO' },
                    include: {
                        medications: { where: { active: true } },
                    }
                },
                students: { where: { status: 'ATIVO' } },
            }
        });
        if (!group)
            return res.status(404).json({ error: 'Class not found' });
        res.json(group);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /attendance - Get attendance for a date
router.get('/attendance', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { date, groupId } = req.query;
        const queryDate = date ? new Date(date) : new Date();
        queryDate.setHours(0, 0, 0, 0);
        const queryDateEnd = new Date(queryDate);
        queryDateEnd.setHours(23, 59, 59, 999);
        const children = await database_1.prisma.child.findMany({
            where: {
                schoolId,
                status: 'ATIVO',
                ...(groupId && { groupId: groupId }),
            },
            include: {
                group: { select: { id: true, name: true } },
                checkInOuts: {
                    where: { date: { gte: queryDate, lte: queryDateEnd } },
                    take: 1
                }
            },
            orderBy: { fullName: 'asc' }
        });
        res.json(children);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /attendance - Register attendance batch
router.post('/attendance', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const checkedById = req.user?.sub;
        const { records, date } = req.body; // records: [{ childId, status, checkInTime?, checkOutTime? }]
        if (!Array.isArray(records))
            return res.status(400).json({ error: 'records must be an array' });
        const recordDate = date ? new Date(date) : new Date();
        recordDate.setHours(0, 0, 0, 0);
        const results = await Promise.all(records.map(async (record) => {
            return database_1.prisma.childCheckInOut.upsert({
                where: { childId_date: { childId: record.childId, date: recordDate } },
                update: {
                    status: record.status,
                    checkedById,
                    ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
                    ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
                },
                create: {
                    schoolId,
                    childId: record.childId,
                    date: recordDate,
                    status: record.status || 'PRESENTE',
                    checkedById,
                    ...(record.checkInTime && { checkInTime: new Date(record.checkInTime) }),
                    ...(record.checkOutTime && { checkOutTime: new Date(record.checkOutTime) }),
                }
            });
        }));
        res.status(201).json(results);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
