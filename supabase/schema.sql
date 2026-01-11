-- Farmers table for user registration
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT,
  land_size_ha DECIMAL NOT NULL,
  soil_type TEXT NOT NULL,
  water_source TEXT NOT NULL,
  irrigation_method TEXT NOT NULL,
  primary_crop TEXT NOT NULL,
  planting_date DATE NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signal history for mock hardware integration
CREATE TABLE IF NOT EXISTS signal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL CHECK (action IN ('IRRIGATE', 'SKIP', 'REDUCE', 'EMERGENCY_STOP')),
  conditions JSONB NOT NULL DEFAULT '{}',
  water_amount_liters INTEGER,
  duration_mins INTEGER,
  signal_status TEXT DEFAULT 'SENT' CHECK (signal_status IN ('SENT', 'ACKNOWLEDGED', 'FAILED', 'PENDING')),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Irrigation logs for water tracking
CREATE TABLE IF NOT EXISTS irrigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  water_used_liters INTEGER NOT NULL DEFAULT 0,
  water_saved_liters INTEGER NOT NULL DEFAULT 0,
  rain_avoided BOOLEAN DEFAULT FALSE,
  et0_mm DECIMAL,
  kc_value DECIMAL,
  crop_stage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crop growth tracking
CREATE TABLE IF NOT EXISTS crop_growth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  crop_id TEXT NOT NULL,
  planting_date DATE NOT NULL,
  current_stage TEXT NOT NULL,
  days_in_stage INTEGER DEFAULT 0,
  kc_coefficient DECIMAL,
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'stressed', 'critical')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Decisions Log (New)
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  confidence INTEGER DEFAULT 0,
  sensor_data JSONB DEFAULT '{}',
  water_used INTEGER DEFAULT 0,
  water_saved INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signal_history_farmer ON signal_history(farmer_id);
CREATE INDEX IF NOT EXISTS idx_signal_history_timestamp ON signal_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_farmer_date ON irrigation_logs(farmer_id, date);
CREATE INDEX IF NOT EXISTS idx_crop_growth_farmer ON crop_growth(farmer_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_farmer ON agent_decisions(farmer_id);

-- Enable Row Level Security
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now, tighten in production)
CREATE POLICY "Allow all for farmers" ON farmers FOR ALL USING (true);
CREATE POLICY "Allow all for signal_history" ON signal_history FOR ALL USING (true);
CREATE POLICY "Allow all for irrigation_logs" ON irrigation_logs FOR ALL USING (true);
CREATE POLICY "Allow all for crop_growth" ON crop_growth FOR ALL USING (true);
CREATE POLICY "Allow all for agent_decisions" ON agent_decisions FOR ALL USING (true);
