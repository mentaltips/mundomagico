"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET /dashboard - Parent dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const userId = req.user?.sub;
        // Find guardian linked to this user
        const guardian = await database_1.prisma.guardian.findFirst({ where: { userId } });
        if (!guardian)
            return res.status(404).json({ error: 'Guardian profile not found' });
        // Get children linked to this guardian
        const childGuardians = await database_1.prisma.childGuardian.findMany({
            where: { guardianId: guardian.id },
            include: {
                child: {
                    include: {
                        group: { select: { id: true, name: true, shift: true } },
                    }
                }
            }
        });
        const children = childGuardians.map((cg) => cg.child);
        const childIds = children.map((c) => c.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        // Today's check-in/out
        const checkIns = await database_1.prisma.childCheckInOut.findMany({
            where: { childId: { in: childIds }, date: { gte: today, lte: todayEnd } }
        });
        // Latest daily reports (unpublished not sent to parents)
        const latestReports = await database_1.prisma.childDailyReport.findMany({
            where: {
                childId: { in: childIds },
                isDraft: false,
                date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            include: {
                meals: true,
                sleep: true,
                hygiene: true,
                health: true,
                moods: true,
                activities: true,
            },
            orderBy: { date: 'desc' },
            take: 10
        });
        // Pending invoices
        const pendingInvoices = await database_1.prisma.invoice.findMany({
            where: { childId: { in: childIds }, status: { in: ['PENDENTE', 'VENCIDO'] } },
            orderBy: { dueDate: 'asc' },
            take: 5
        });
        // Recent photos shared with parents
        const photos = await database_1.prisma.childPhoto.findMany({
            where: { childId: { in: childIds }, sharedWithParents: true },
            orderBy: { date: 'desc' },
            take: 10
        });
        // Pinned announcements
        const announcements = await database_1.prisma.announcement.findMany({
            where: { schoolId, OR: [{ isPinned: true }, { targetRole: 'GUARDIAN' }] },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: 5
        });
        res.json({
            guardian,
            children,
            checkIns,
            latestReports,
            pendingInvoices,
            photos,
            announcements,
        });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /feed - Activity feed for guardian
router.get('/feed', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const userId = req.user?.sub;
        const { page = '1', limit = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const guardian = await database_1.prisma.guardian.findFirst({ where: { userId } });
        if (!guardian)
            return res.status(404).json({ error: 'Guardian profile not found' });
        const childGuardians = await database_1.prisma.childGuardian.findMany({ where: { guardianId: guardian.id } });
        const childIds = childGuardians.map((cg) => cg.childId);
        const feed = [];
        // Daily reports published
        const reports = await database_1.prisma.childDailyReport.findMany({
            where: { childId: { in: childIds }, isDraft: false },
            include: {
                child: { select: { id: true, fullName: true, photoUrl: true } },
                meals: true,
                sleep: true,
                moods: true,
                activities: true,
            },
            orderBy: { date: 'desc' },
            take: Number(limit),
            skip
        });
        reports.forEach((r) => {
            feed.push({ type: 'DAILY_REPORT', date: r.date, data: r });
        });
        // Photos shared with parents
        const photos = await database_1.prisma.childPhoto.findMany({
            where: { childId: { in: childIds }, sharedWithParents: true },
            include: { child: { select: { id: true, fullName: true } } },
            orderBy: { date: 'desc' },
            take: Number(limit),
        });
        photos.forEach((p) => {
            feed.push({ type: 'PHOTO', date: p.date, data: p });
        });
        // Announcements targeting guardians or all
        const announcements = await database_1.prisma.announcement.findMany({
            where: {
                schoolId,
                OR: [{ targetRole: 'GUARDIAN' }, { targetRole: null }]
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });
        announcements.forEach((a) => {
            feed.push({ type: 'ANNOUNCEMENT', date: a.createdAt, data: a });
        });
        // Development reports published
        const devReports = await database_1.prisma.developmentReport.findMany({
            where: { childId: { in: childIds }, isDraft: false },
            include: { child: { select: { id: true, fullName: true } } },
            orderBy: { publishedAt: 'desc' },
            take: 10,
        });
        devReports.forEach((dr) => {
            feed.push({ type: 'DEVELOPMENT_REPORT', date: dr.publishedAt || dr.updatedAt, data: dr });
        });
        // Sort all by date desc
        feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json({
            page: Number(page),
            limit: Number(limit),
            items: feed.slice(0, Number(limit))
        });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
