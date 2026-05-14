"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List calendar events
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { startDate, endDate } = req.query;
        const events = await database_1.prisma.calendarEvent.findMany({
            where: {
                schoolId,
                ...(startDate && endDate && {
                    date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate),
                    }
                })
            },
            orderBy: { date: 'asc' }
        });
        res.json(events);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create calendar event
router.post('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { date, ...rest } = req.body;
        const event = await database_1.prisma.calendarEvent.create({
            data: { ...rest, schoolId, date: new Date(date) }
        });
        res.status(201).json(event);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /:id - Update calendar event
router.patch('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { date, ...rest } = req.body;
        const result = await database_1.prisma.calendarEvent.updateMany({
            where: { id: req.params.id, schoolId },
            data: { ...rest, ...(date && { date: new Date(date) }) }
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'Event not found' });
        const updated = await database_1.prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Delete calendar event
router.delete('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const result = await database_1.prisma.calendarEvent.deleteMany({ where: { id: req.params.id, schoolId } });
        if (result.count === 0)
            return res.status(404).json({ error: 'Event not found' });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
