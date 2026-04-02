-- Fix existing invoices with folio=0: assign sequential folios per profile+serie
-- Run this BEFORE the unique index migration

WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY issuing_profile_id, serie
      ORDER BY created_at ASC
    ) AS new_folio
  FROM invoices
)
UPDATE invoices
SET folio = numbered.new_folio
FROM numbered
WHERE invoices.id = numbered.id;
