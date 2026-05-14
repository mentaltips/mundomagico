"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List child items
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { childId } = req.query;
        const items = await database_1.prisma.childItem.findMany({
            where: { schoolId, ...(childId && { childId: childId }) },
            include: {
                child: { select: { id: true, fullName: true } },
                _count: { select: { usageHistory: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create child item
router.post('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { lastReplenished, ...rest } = req.body;
        const item = await database_1.prisma.childItem.create({
            data: {
                ...rest,
                schoolId,
                ...(lastReplenished && { lastReplenished: new Date(lastReplenished) }),
            }
        });
        res.status(201).json(item);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /:id - Update child item
router.patch('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { lastReplenished, ...rest } = req.body;
        const result = await database_1.prisma.childItem.updateMany({
            where: { id: req.params.id, schoolId },
            data: {
                ...rest,
                ...(lastReplenished && { lastReplenished: new Date(lastReplenished) }),
            }
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'Item not found' });
        const updated = await database_1.prisma.childItem.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Delete child item
router.delete('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const result = await database_1.prisma.childItem.deleteMany({ where: { id: req.params.id, schoolId } });
        if (result.count === 0)
            return res.status(404).json({ error: 'Item not found' });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/use - Register usage
router.post('/:id/use', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const item = await database_1.prisma.childItem.findFirst({ where: { id: req.params.id, schoolId } });
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        const { quantity = 1, notes } = req.body;
        const [usage] = await database_1.prisma.$transaction([
            database_1.prisma.childItemUsage.create({
                data: { itemId: req.params.id, quantity, notes }
            }),
            database_1.prisma.childItem.update({
                where: { id: req.params.id },
                data: { quantityUsed: { increment: quantity } }
            })
        ]);
        res.status(201).json(usage);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /:id/replenish - Replenish stock
router.post('/:id/replenish', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const item = await database_1.prisma.childItem.findFirst({ where: { id: req.params.id, schoolId } });
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        const { quantity = 0, notes } = req.body;
        const updated = await database_1.prisma.childItem.update({
            where: { id: req.params.id },
            data: {
                quantityReceived: { increment: quantity },
                lastReplenished: new Date(),
                ...(notes !== undefined && { notes }),
            }
        });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
