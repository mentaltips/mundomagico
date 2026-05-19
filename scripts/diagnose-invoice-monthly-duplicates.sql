-- Diagnostico de duplicidades para a migration 20260519043000_invoice_monthly_idempotency.
-- Execute antes de aplicar a migration em staging/producao.
--
-- O script e somente leitura: nao altera, nao apaga e nao mescla dados.
-- Ele lista mensalidades duplicadas que bloqueariam as constraints:
--   Invoice(schoolId, childId, referenceMonth)
--   Invoice(schoolId, studentId, referenceMonth)

\echo 'Resumo de duplicidades por crianca'

SELECT
  i."schoolId",
  s.name AS "schoolName",
  i."childId",
  c."fullName" AS "childName",
  i."referenceMonth",
  COUNT(*) AS "invoiceCount",
  ARRAY_AGG(i.id ORDER BY i."createdAt") AS "invoiceIds",
  MIN(i."createdAt") AS "firstCreatedAt",
  MAX(i."createdAt") AS "lastCreatedAt"
FROM "Invoice" i
LEFT JOIN "School" s ON s.id = i."schoolId"
LEFT JOIN "Child" c ON c.id = i."childId"
WHERE i."childId" IS NOT NULL
  AND i."referenceMonth" IS NOT NULL
GROUP BY i."schoolId", s.name, i."childId", c."fullName", i."referenceMonth"
HAVING COUNT(*) > 1
ORDER BY s.name, c."fullName", i."referenceMonth";

\echo 'Resumo de duplicidades por aluno'

SELECT
  i."schoolId",
  s.name AS "schoolName",
  i."studentId",
  st."fullName" AS "studentName",
  i."referenceMonth",
  COUNT(*) AS "invoiceCount",
  ARRAY_AGG(i.id ORDER BY i."createdAt") AS "invoiceIds",
  MIN(i."createdAt") AS "firstCreatedAt",
  MAX(i."createdAt") AS "lastCreatedAt"
FROM "Invoice" i
LEFT JOIN "School" s ON s.id = i."schoolId"
LEFT JOIN "Student" st ON st.id = i."studentId"
WHERE i."studentId" IS NOT NULL
  AND i."referenceMonth" IS NOT NULL
GROUP BY i."schoolId", s.name, i."studentId", st."fullName", i."referenceMonth"
HAVING COUNT(*) > 1
ORDER BY s.name, st."fullName", i."referenceMonth";

\echo 'Contagem final de grupos duplicados'

WITH child_duplicates AS (
  SELECT 1
  FROM "Invoice"
  WHERE "childId" IS NOT NULL
    AND "referenceMonth" IS NOT NULL
  GROUP BY "schoolId", "childId", "referenceMonth"
  HAVING COUNT(*) > 1
),
student_duplicates AS (
  SELECT 1
  FROM "Invoice"
  WHERE "studentId" IS NOT NULL
    AND "referenceMonth" IS NOT NULL
  GROUP BY "schoolId", "studentId", "referenceMonth"
  HAVING COUNT(*) > 1
)
SELECT
  (SELECT COUNT(*) FROM child_duplicates) AS "duplicateChildGroups",
  (SELECT COUNT(*) FROM student_duplicates) AS "duplicateStudentGroups";

\echo 'Faturas mensais sem vinculo com crianca ou aluno'

SELECT
  i.id,
  i."schoolId",
  s.name AS "schoolName",
  i."referenceMonth",
  i.description,
  i.amount,
  i.status,
  i."createdAt"
FROM "Invoice" i
LEFT JOIN "School" s ON s.id = i."schoolId"
WHERE i."referenceMonth" IS NOT NULL
  AND i."childId" IS NULL
  AND i."studentId" IS NULL
ORDER BY i."createdAt" DESC;
