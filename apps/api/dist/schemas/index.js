"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoiceSchema = exports.createMedicationSchema = exports.updateGroupSchema = exports.createGroupSchema = exports.createAuthorizedPickupSchema = exports.updateGuardianSchema = exports.createGuardianSchema = exports.checkInOutSchema = exports.updateChildSchema = exports.createChildSchema = void 0;
const zod_1 = require("zod");
// ─────────────────────────────────────────
// Helpers reutilizáveis
// ─────────────────────────────────────────
const isoDate = zod_1.z.string().datetime({ offset: true }).or(zod_1.z.string().date());
const optionalDate = isoDate.optional().nullable();
const optionalString = zod_1.z.string().optional().nullable();
const optionalBool = zod_1.z.boolean().optional();
// ─────────────────────────────────────────
// CRIANÇA
// ─────────────────────────────────────────
exports.createChildSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    birthDate: isoDate,
    nickname: optionalString,
    photoUrl: optionalString,
    gender: zod_1.z.enum(['MASCULINO', 'FEMININO', 'OUTRO']).optional().nullable(),
    groupId: optionalString,
    registrationNumber: optionalString,
    shift: zod_1.z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
    contractedHours: optionalString,
    entryDate: optionalDate,
    exitDate: optionalDate,
    status: zod_1.z.enum(['ATIVO', 'INATIVO', 'ADAPTACAO', 'AGUARDANDO_VAGA', 'CANCELADO']).default('ATIVO'),
    // Saúde
    bloodType: optionalString,
    allergies: optionalString,
    continuousMeds: optionalString,
    dietaryRestrictions: optionalString,
    healthObservations: optionalString,
    // Rotina
    usesDiapers: optionalBool,
    usesBottle: optionalBool,
    usesNipple: optionalBool,
    specialSleep: optionalString,
    observations: optionalString,
    // Imagem
    imageAuthorized: optionalBool,
    imageAuthDate: optionalDate,
    imageAuthBy: optionalString,
});
exports.updateChildSchema = exports.createChildSchema.partial();
// ─────────────────────────────────────────
// CHECK-IN / CHECK-OUT
// ─────────────────────────────────────────
exports.checkInOutSchema = zod_1.z.object({
    childId: zod_1.z.string().min(1, 'childId é obrigatório'),
    date: optionalDate,
    status: zod_1.z.enum(['PRESENTE', 'AUSENTE', 'SAIU_MAIS_CEDO', 'AGUARDANDO_RETIRADA']).optional(),
    checkInTime: optionalDate,
    broughtBy: optionalString,
    broughtByDoc: optionalString,
    broughtByPhoto: optionalString,
    checkInSignature: optionalString,
    checkInNote: optionalString,
    checkOutTime: optionalDate,
    pickedUpBy: optionalString,
    pickedUpByDoc: optionalString,
    pickedUpByPhoto: optionalString,
    checkOutSignature: optionalString,
    checkOutNote: optionalString,
});
// ─────────────────────────────────────────
// RESPONSÁVEL
// ─────────────────────────────────────────
exports.createGuardianSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    relationship: zod_1.z.string().min(1, 'Parentesco é obrigatório'),
    phone: optionalString,
    email: zod_1.z.string().email('Email inválido').optional().nullable(),
    cpf: optionalString,
    rg: optionalString,
    address: optionalString,
    profession: optionalString,
    workPhone: optionalString,
    photoUrl: optionalString,
    notes: optionalString,
});
exports.updateGuardianSchema = exports.createGuardianSchema.partial();
// ─────────────────────────────────────────
// PESSOA AUTORIZADA A BUSCAR
// ─────────────────────────────────────────
exports.createAuthorizedPickupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
    relationship: zod_1.z.string().min(1, 'Parentesco é obrigatório'),
    cpf: optionalString,
    rg: optionalString,
    phone: optionalString,
    photoUrl: optionalString,
    authorization: zod_1.z.enum(['SIM', 'NAO', 'TEMPORARIO']).default('SIM'),
    validUntil: optionalDate,
    notes: optionalString,
});
// ─────────────────────────────────────────
// GRUPO
// ─────────────────────────────────────────
exports.createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome do grupo é obrigatório'),
    shift: zod_1.z.enum(['MANHA', 'TARDE', 'INTEGRAL', 'NOTURNO']).default('MANHA'),
    minAge: zod_1.z.number().int().min(0).optional().nullable(),
    maxAge: zod_1.z.number().int().min(0).optional().nullable(),
    capacity: zod_1.z.number().int().min(1).optional().nullable(),
    room: optionalString,
    active: optionalBool,
});
exports.updateGroupSchema = exports.createGroupSchema.partial();
// ─────────────────────────────────────────
// MEDICAÇÃO
// ─────────────────────────────────────────
exports.createMedicationSchema = zod_1.z.object({
    childId: zod_1.z.string().min(1, 'childId é obrigatório'),
    name: zod_1.z.string().min(1, 'Nome do medicamento é obrigatório'),
    dosage: zod_1.z.string().min(1, 'Dosagem é obrigatória'),
    frequency: optionalString,
    startDate: isoDate,
    endDate: optionalDate,
    prescriptionUrl: optionalString,
    guardianAuthorization: optionalString,
    guardianAuthDate: optionalDate,
    notes: optionalString,
    active: optionalBool,
});
// ─────────────────────────────────────────
// FATURA
// ─────────────────────────────────────────
exports.createInvoiceSchema = zod_1.z.object({
    childId: optionalString,
    studentId: optionalString,
    guardianId: optionalString,
    description: zod_1.z.string().min(1, 'Descrição é obrigatória'),
    amount: zod_1.z.number().positive('Valor deve ser positivo'),
    dueDate: isoDate,
    referenceMonth: optionalString,
    status: zod_1.z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).default('PENDENTE'),
});
