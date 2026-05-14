"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET /invoices - List invoices
router.get('/invoices', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { status, childId, studentId, referenceMonth } = req.query;
        const invoices = await database_1.prisma.invoice.findMany({
            where: {
                schoolId,
                ...(status && { status: status }),
                ...(childId && { childId: childId }),
                ...(studentId && { studentId: studentId }),
                ...(referenceMonth && { referenceMonth: referenceMonth }),
            },
            include: {
                child: { select: { id: true, fullName: true } },
                student: { select: { id: true, fullName: true } },
                payments: true
            },
            orderBy: { dueDate: 'desc' }
        });
        res.json(invoices);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /invoices - Create invoice(s)
router.post('/invoices', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const data = req.body;
        if (Array.isArray(data)) {
            // Batch creation
            const results = await Promise.all(data.map(async (item) => {
                const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = item;
                try {
                    // Check for duplicate referenceMonth if needed, but let's keep it simple
                    const invoice = await database_1.prisma.invoice.create({
                        data: {
                            ...rest,
                            schoolId,
                            dueDate: new Date(dueDate),
                            ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
                            ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
                            ...(paidAt && { paidAt: new Date(paidAt) }),
                        }
                    });
                    return invoice;
                }
                catch (err) {
                    return { error: 'Failed to create', childId: rest.childId, skipped: true };
                }
            }));
            return res.status(201).json(results);
        }
        const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = data;
        const invoice = await database_1.prisma.invoice.create({
            data: {
                ...rest,
                schoolId,
                dueDate: new Date(dueDate),
                ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
                ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
                ...(paidAt && { paidAt: new Date(paidAt) }),
            }
        });
        res.status(201).json(invoice);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /invoices/:id - Delete invoice
router.delete('/invoices/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const invoice = await database_1.prisma.invoice.findFirst({ where: { id: req.params.id, schoolId } });
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        if (invoice.status === 'PAGO') {
            return res.status(400).json({ error: 'Cannot delete a paid invoice' });
        }
        await database_1.prisma.invoice.delete({ where: { id: req.params.id } });
        res.status(204).send();
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /invoices/:id - Get invoice
router.get('/invoices/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const invoice = await database_1.prisma.invoice.findFirst({
            where: { id: req.params.id, schoolId },
            include: {
                child: { select: { id: true, fullName: true } },
                student: { select: { id: true, fullName: true } },
                payments: true
            }
        });
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PATCH /invoices/:id - Update invoice
router.patch('/invoices/:id', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const { dueDate, boletoExpiry, pixExpiry, paidAt, ...rest } = req.body;
        const result = await database_1.prisma.invoice.updateMany({
            where: { id: req.params.id, schoolId },
            data: {
                ...rest,
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(boletoExpiry && { boletoExpiry: new Date(boletoExpiry) }),
                ...(pixExpiry && { pixExpiry: new Date(pixExpiry) }),
                ...(paidAt && { paidAt: new Date(paidAt) }),
            }
        });
        if (result.count === 0)
            return res.status(404).json({ error: 'Invoice not found' });
        const updated = await database_1.prisma.invoice.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /invoices/:id/pay - Register payment
router.post('/invoices/:id/pay', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const invoice = await database_1.prisma.invoice.findFirst({ where: { id: req.params.id, schoolId } });
        if (!invoice)
            return res.status(404).json({ error: 'Invoice not found' });
        const { method, amount, mpPaymentId, mpStatus, paidAt } = req.body;
        const paymentDate = paidAt ? new Date(paidAt) : new Date();
        const [payment] = await database_1.prisma.$transaction([
            database_1.prisma.payment.create({
                data: {
                    invoiceId: req.params.id,
                    method: method || 'MANUAL',
                    amount: amount || invoice.amount,
                    mpPaymentId,
                    mpStatus,
                    paidAt: paymentDate,
                }
            }),
            database_1.prisma.invoice.update({
                where: { id: req.params.id },
                data: {
                    status: 'PAGO',
                    paidAt: paymentDate,
                    paidAmount: amount || invoice.amount,
                }
            })
        ]);
        res.status(201).json(payment);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
