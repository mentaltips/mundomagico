"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - List children with active medications
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const children = await database_1.prisma.child.findMany({
            where: {
                schoolId,
                medications: { some: { active: true } }
            },
            include: {
                group: { select: { id: true, name: true } },
                medications: {
                    where: { active: true },
                    include: {
                        administrations: {
                            orderBy: { administeredAt: 'desc' },
                            take: 5
                        }
                    }
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
// GET /medications - List all medications
router.get('/medications', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { childId, active } = req.query;
        const medications = await database_1.prisma.medication.findMany({
            where: {
                schoolId,
                ...(childId && { childId: childId }),
                ...(active !== undefined && { active: active === 'true' }),
            },
            include: {
                child: { select: { id: true, fullName: true } },
                administrations: {
                    orderBy: { administeredAt: 'desc' },
                    take: 10
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(medications);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /medications - Create medication
router.post('/medications', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { startDate, endDate, guardianAuthDate, ...rest } = req.body;
        const medication = await database_1.prisma.medication.create({
            data: {
                ...rest,
                schoolId,
                startDate: new Date(startDate),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(guardianAuthDate && { guardianAuthDate: new Date(guardianAuthDate) }),
            }
        });
        res.status(201).json(medication);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /medications/:id - Update medication
router.patch('/medications/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { startDate, endDate, guardianAuthDate, ...rest } = req.body;
        const result = await database_1.prisma.medication.updateMany({
            where: { id: req.params.id, schoolId },
            data: {
                ...rest,
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(guardianAuthDate && { guardianAuthDate: new Date(guardianAuthDate) }),
            }
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'Medication not found' });
        const updated = await database_1.prisma.medication.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /medications/:id/administer - Register administration
router.post('/medications/:id/administer', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const administeredBy = req.user?.sub;
        const medication = await database_1.prisma.medication.findFirst({ where: { id: req.params.id, schoolId } });
        if (!medication)
            return res.status(404).json({ error: 'Medication not found' });
        const { administeredAt, dosage, notes } = req.body;
        const admin = await database_1.prisma.medicationAdministration.create({
            data: {
                medicationId: req.params.id,
                administeredBy,
                administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
                dosage: dosage || medication.dosage,
                notes,
            }
        });
        res.status(201).json(admin);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
