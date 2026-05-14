"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET /:id - Get document by id
router.get('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const document = await database_1.prisma.childDocument.findFirst({
            where: {
                id: req.params.id,
                child: { schoolId }
            },
            include: {
                child: { select: { id: true, fullName: true, schoolId: true } }
            }
        });
        if (!document)
            return res.status(404).json({ error: 'Document not found' });
        res.json(document);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST / - Create document record
router.post('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { childId, name, docType, url } = req.body;
        // Verify child belongs to school
        const child = await database_1.prisma.child.findFirst({ where: { id: childId, schoolId } });
        if (!child)
            return res.status(404).json({ error: 'Child not found' });
        const document = await database_1.prisma.childDocument.create({
            data: { childId, name, docType, url }
        });
        res.status(201).json(document);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /:id - Delete document
router.delete('/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const document = await database_1.prisma.childDocument.findFirst({
            where: {
                id: req.params.id,
                child: { schoolId }
            }
        });
        if (!document)
            return res.status(404).json({ error: 'Document not found' });
        await database_1.prisma.childDocument.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
