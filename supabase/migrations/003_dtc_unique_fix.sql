-- Fix DTC unique constraint: allow same code from different manufacturers
-- e.g., P0301 can exist for Honda, Yamaha, Kawasaki with different diagnostic info

-- Drop ALL possible constraint/index names for the code unique constraint
ALTER TABLE dtc_codes DROP CONSTRAINT IF EXISTS dtc_codes_code_key;
ALTER TABLE dtc_codes DROP CONSTRAINT IF EXISTS dtc_codes_code_unique;
ALTER TABLE dtc_codes DROP CONSTRAINT IF EXISTS dtc_codes_code_code1_key;
DROP INDEX IF EXISTS dtc_codes_code_key;
DROP INDEX IF EXISTS dtc_codes_code_unique;
DROP INDEX IF EXISTS idx_dtc_codes_code_manufacturer;

-- Create compound unique: same code allowed for different manufacturers
CREATE UNIQUE INDEX idx_dtc_codes_code_manufacturer ON dtc_codes(code, COALESCE(manufacturer, ''));
