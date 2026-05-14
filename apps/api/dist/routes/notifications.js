"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@mundo-magico/database");
const router = (0, express_1.Router)();
// GET / - Get notifications for the current user
// Aggregates: low child items, overdue invoices, pinned announcements
router.get('/', async (req, res) => {
    try {
        const schoolId = req.user?.schoolId;
        const userId = req.user?.sub;
        const role = req.user?.role;
        const notifications = [];
        // Low stock child items
        const allItems = await database_1.prisma.childItem.findMany({ where: { schoolId } });
        const lowStockItems = allItems.filter(i => (i.quantityReceived - i.quantityUsed) <= i.alertThreshold);
        lowStockItems.forEach(item => {
            notifications.push({
                type: 'LOW_STOCK',
                severity: 'warning',
                itemId: item.id,
                childId: item.childId,
                message: `Item "${item.itemType}" com estoque baixo`,
                createdAt: item.updatedAt,
            });
        });
        // Overdue invoices (admin/director only)
        if (role === 'ADMIN' || role === 'DIRECTOR') {
            const overdueInvoices = await database_1.prisma.invoice.findMany({
                where: {
                    schoolId,
                    status: 'PENDENTE',
                    dueDate: { lt: new Date() }
                },
                include: {
                    child: { select: { id: true, fullName: true } },
                    student: { select: { id: true, fullName: true } }
                },
                take: 20
            });
            overdueInvoices.forEach(inv => {
                notifications.push({
                    type: 'OVERDUE_INVOICE',
                    severity: 'error',
                    invoiceId: inv.id,
                    message: `Fatura vencida: ${inv.description}`,
                    createdAt: inv.updatedAt,
                });
            });
        }
        // Recent pinned announcements
        const pinned = await database_1.prisma.announcement.findMany({
            where: { schoolId, isPinned: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        pinned.forEach(ann => {
            notifications.push({
                type: 'PINNED_ANNOUNCEMENT',
                severity: 'info',
                announcementId: ann.id,
                message: ann.title,
                createdAt: ann.createdAt,
            });
        });
        // Sort by createdAt desc
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(notifications);
    }
    catch (error) {
        req.log.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
