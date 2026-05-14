"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List announcements
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const announcements = await database_1.prisma.announcement.findMany({
            where: { schoolId },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
        });
        res.json(announcements);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create announcement
router.post('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { sentAt, ...rest } = req.body;
        const announcement = await database_1.prisma.announcement.create({
            data: {
                ...rest,
                schoolId,
                ...(sentAt && { sentAt: new Date(sentAt) }),
            }
        });
        res.status(201).json(announcement);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /:id - Update announcement
router.patch('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { sentAt, ...rest } = req.body;
        const result = await database_1.prisma.announcement.updateMany({
            where: { id: req.params.id, schoolId },
            data: {
                ...rest,
                ...(sentAt && { sentAt: new Date(sentAt) }),
            }
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'Announcement not found' });
        const updated = await database_1.prisma.announcement.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Delete announcement
router.delete('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const result = await database_1.prisma.announcement.deleteMany({ where: { id: req.params.id, schoolId } });
        if (result.count === 0)
            return res.status(404).json({ error: 'Announcement not found' });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
