"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List daily reports (simplified view, without nested relations)
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { childId, groupId, date, isDraft } = req.query;
        let childIds;
        if (groupId) {
            const children = await database_1.prisma.child.findMany({
                where: { schoolId, groupId: groupId },
                select: { id: true }
            });
            childIds = children.map((c) => c.id);
        }
        const reports = await database_1.prisma.childDailyReport.findMany({
            where: {
                schoolId,
                ...(childId && { childId: childId }),
                ...(childIds && { childId: { in: childIds } }),
                ...(date && {
                    date: {
                        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                        lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
                    }
                }),
                ...(isDraft !== undefined && { isDraft: isDraft === 'true' }),
            },
            include: {
                child: { select: { id: true, fullName: true, photoUrl: true, groupId: true } },
                author: { select: { id: true, name: true } },
                meals: true,
                sleep: true,
                hygiene: true,
                health: true,
                moods: true,
                activities: true,
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
        });
        res.json(reports);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create or upsert daily report
router.post('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const createdBy = req.user?.sub;
        const { childId, date, isDraft, sentAt, sentVia, generalNote, teamNote, messageToParents, importantAlert, homeRecommendation, itemRequests, meals, sleep, hygiene, health, moods, activities, } = req.body;
        const reportDate = new Date(date);
        const report = await database_1.prisma.childDailyReport.upsert({
            where: { childId_date: { childId, date: reportDate } },
            update: {
                isDraft: isDraft ?? true,
                ...(sentAt && { sentAt: new Date(sentAt) }),
                sentVia,
                generalNote,
                teamNote,
                messageToParents,
                importantAlert,
                homeRecommendation,
                itemRequests,
            },
            create: {
                schoolId,
                childId,
                createdBy,
                date: reportDate,
                isDraft: isDraft ?? true,
                ...(sentAt && { sentAt: new Date(sentAt) }),
                sentVia,
                generalNote,
                teamNote,
                messageToParents,
                importantAlert,
                homeRecommendation,
                itemRequests,
            }
        });
        if (meals && Array.isArray(meals)) {
            await database_1.prisma.dailyMeal.deleteMany({ where: { reportId: report.id } });
            if (meals.length > 0) {
                await database_1.prisma.dailyMeal.createMany({ data: meals.map((m) => ({ ...m, reportId: report.id })) });
            }
        }
        if (sleep) {
            await database_1.prisma.dailySleep.upsert({ where: { reportId: report.id }, update: sleep, create: { ...sleep, reportId: report.id } });
        }
        if (hygiene) {
            await database_1.prisma.dailyHygiene.upsert({ where: { reportId: report.id }, update: hygiene, create: { ...hygiene, reportId: report.id } });
        }
        if (health) {
            await database_1.prisma.dailyHealth.upsert({ where: { reportId: report.id }, update: health, create: { ...health, reportId: report.id } });
        }
        if (moods && Array.isArray(moods)) {
            await database_1.prisma.dailyMood.deleteMany({ where: { reportId: report.id } });
            if (moods.length > 0) {
                await database_1.prisma.dailyMood.createMany({ data: moods.map((m) => ({ ...m, reportId: report.id })) });
            }
        }
        if (activities && Array.isArray(activities)) {
            await database_1.prisma.dailyActivity.deleteMany({ where: { reportId: report.id } });
            if (activities.length > 0) {
                await database_1.prisma.dailyActivity.createMany({ data: activities.map((a) => ({ ...a, reportId: report.id })) });
            }
        }
        const full = await database_1.prisma.childDailyReport.findUnique({
            where: { id: report.id },
            include: {
                child: { select: { id: true, fullName: true } },
                meals: true,
                sleep: true,
                hygiene: true,
                health: true,
                moods: true,
                activities: true,
                author: { select: { id: true, name: true } }
            }
        });
        res.status(201).json(full);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
