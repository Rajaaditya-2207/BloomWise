-- =====================================================
-- MIGRATION SCRIPT: Digital Twin Hourly Upgrade
-- Run this ONCE on existing Supabase databases
-- =====================================================

-- 1. Add power_schedule to farmers table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'farmers' AND column_name = 'power_schedule') THEN
        ALTER TABLE farmers ADD COLUMN power_schedule TEXT DEFAULT 'morning_evening';
    END IF;
END $$;

-- 2. Add new columns to agent_decisions (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_decisions' AND column_name = 'simulation_date') THEN
        ALTER TABLE agent_decisions ADD COLUMN simulation_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_decisions' AND column_name = 'simulation_hour') THEN
        ALTER TABLE agent_decisions ADD COLUMN simulation_hour INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_decisions' AND column_name = 'power_available') THEN
        ALTER TABLE agent_decisions ADD COLUMN power_available BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. Backfill existing rows with values derived from created_at
UPDATE agent_decisions 
SET 
    simulation_date = COALESCE(simulation_date, DATE(created_at)),
    simulation_hour = COALESCE(simulation_hour, EXTRACT(HOUR FROM created_at)::INTEGER)
WHERE simulation_date IS NULL OR simulation_hour IS NULL;

-- 4. Add constraint for simulation_hour (safe - only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name = 'agent_decisions_simulation_hour_check') THEN
        ALTER TABLE agent_decisions ADD CONSTRAINT agent_decisions_simulation_hour_check CHECK (simulation_hour >= 0 AND simulation_hour <= 23);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists, ignore
END $$;

-- 5. Create index for efficient hourly queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_agent_decisions_date_hour ON agent_decisions(simulation_date, simulation_hour);

-- 6. Create helper RPC function for water logging (used by background agent)
CREATE OR REPLACE FUNCTION increment_water_usage(p_farmer_id UUID, p_date DATE, p_liters INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO irrigation_logs (farmer_id, date, water_used_liters, water_saved_liters)
    VALUES (p_farmer_id, p_date, p_liters, 0)
    ON CONFLICT (farmer_id, date) DO UPDATE
    SET water_used_liters = irrigation_logs.water_used_liters + p_liters;
END;
$$ LANGUAGE plpgsql;

-- 7. Add unique constraint for upsert (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'irrigation_logs_farmer_date_unique') THEN
        ALTER TABLE irrigation_logs ADD CONSTRAINT irrigation_logs_farmer_date_unique UNIQUE (farmer_id, date);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists, ignore
END $$;

-- Done! Your database is now ready for the Digital Twin hourly simulation.
