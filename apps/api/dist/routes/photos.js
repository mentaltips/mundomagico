"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List photos
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { childId, groupId, sharedWithParents } = req.query;
        const photos = await database_1.prisma.childPhoto.findMany({
            where: {
                schoolId,
                ...(childId && { childId: childId }),
                ...(groupId && { groupId: groupId }),
                ...(sharedWithParents !== undefined && { sharedWithParents: sharedWithParents === 'true' }),
            },
            include: {
                child: { select: { id: true, fullName: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(photos);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create photo record
router.post('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { date, ...rest } = req.body;
        const photo = await database_1.prisma.childPhoto.create({
            data: {
                ...rest,
                schoolId,
                ...(date && { date: new Date(date) }),
            }
        });
        res.status(201).json(photo);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Delete photo
router.delete('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const result = await database_1.prisma.childPhoto.deleteMany({ where: { id: req.params.id, schoolId } });
        if (result.count === 0)
            return res.status(404).json({ error: 'Photo not found' });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
