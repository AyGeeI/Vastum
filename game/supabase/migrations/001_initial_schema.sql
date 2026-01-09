-- ================================================
-- VASTUM Database Schema - Initial Migration
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. USERS TABLE (without alliance reference first)
-- ================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    alliance_id UUID, -- Will add foreign key later
    is_protected BOOLEAN DEFAULT TRUE,
    protection_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_google_id ON users(google_id);

-- ================================================
-- 2. ALLIANCES TABLE
-- ================================================
CREATE TABLE alliances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    founder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alliances_tag ON alliances(tag);

-- Now add foreign key to users
ALTER TABLE users ADD CONSTRAINT fk_users_alliance 
    FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE SET NULL;

CREATE INDEX idx_users_alliance_id ON users(alliance_id);

-- ================================================
-- 3. ALLIANCE MEMBERS TABLE
-- ================================================
CREATE TABLE alliance_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('founder', 'leader', 'officer', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(alliance_id, user_id)
);

CREATE INDEX idx_alliance_members_alliance ON alliance_members(alliance_id);
CREATE INDEX idx_alliance_members_user ON alliance_members(user_id);

-- ================================================
-- 4. PLANETS TABLE
-- ================================================
CREATE TABLE planets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('terra', 'desert', 'ice', 'volcano', 'gas_giant', 'asteroid')),
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    size INTEGER DEFAULT 150 CHECK (size >= 50 AND size <= 300),
    temperature INTEGER DEFAULT 20,
    is_starter BOOLEAN DEFAULT FALSE,
    
    -- Resource bonuses (multipliers, 1.0 = 100%)
    metal_bonus DECIMAL(3,2) DEFAULT 1.00,
    crystal_bonus DECIMAL(3,2) DEFAULT 1.00,
    deuterium_bonus DECIMAL(3,2) DEFAULT 1.00,
    energy_bonus DECIMAL(3,2) DEFAULT 1.00,
    rare_earth_bonus DECIMAL(3,2) DEFAULT 1.00,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(position_x, position_y)
);

CREATE INDEX idx_planets_owner ON planets(owner_id);
CREATE INDEX idx_planets_position ON planets(position_x, position_y);
CREATE INDEX idx_planets_starter ON planets(is_starter) WHERE is_starter = TRUE;

-- ================================================
-- 5. PLANET RESOURCES TABLE
-- ================================================
CREATE TABLE planet_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planet_id UUID UNIQUE NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
    
    -- Current amounts
    metal DECIMAL(20,2) DEFAULT 500,
    crystal DECIMAL(20,2) DEFAULT 300,
    deuterium DECIMAL(20,2) DEFAULT 100,
    rare_earth DECIMAL(20,2) DEFAULT 0,
    
    -- Production per hour
    metal_production DECIMAL(20,2) DEFAULT 30,
    crystal_production DECIMAL(20,2) DEFAULT 15,
    deuterium_production DECIMAL(20,2) DEFAULT 0,
    energy_production DECIMAL(20,2) DEFAULT 0,
    energy_consumption DECIMAL(20,2) DEFAULT 0,
    
    -- Storage capacity
    metal_capacity DECIMAL(20,2) DEFAULT 10000,
    crystal_capacity DECIMAL(20,2) DEFAULT 10000,
    deuterium_capacity DECIMAL(20,2) DEFAULT 10000,
    
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_planet_resources_planet ON planet_resources(planet_id);

-- ================================================
-- 6. BUILDINGS TABLE
-- ================================================
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planet_id UUID NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 0,
    is_upgrading BOOLEAN DEFAULT FALSE,
    upgrade_finish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(planet_id, type)
);

CREATE INDEX idx_buildings_planet ON buildings(planet_id);
CREATE INDEX idx_buildings_upgrading ON buildings(is_upgrading) WHERE is_upgrading = TRUE;

-- ================================================
-- 7. FLEETS TABLE
-- ================================================
CREATE TABLE fleets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'Flotte',
    current_planet_id UUID REFERENCES planets(id) ON DELETE SET NULL,
    
    -- Ship counts
    fighters INTEGER DEFAULT 0,
    bombers INTEGER DEFAULT 0,
    cruisers INTEGER DEFAULT 0,
    battleships INTEGER DEFAULT 0,
    transporters INTEGER DEFAULT 0,
    spy_probes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fleets_owner ON fleets(owner_id);
CREATE INDEX idx_fleets_planet ON fleets(current_planet_id);

-- ================================================
-- 8. FLEET MOVEMENTS TABLE
-- ================================================
CREATE TABLE fleet_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission VARCHAR(20) NOT NULL CHECK (mission IN ('attack', 'transport', 'spy', 'colonize', 'deploy')),
    origin_planet_id UUID NOT NULL REFERENCES planets(id),
    destination_planet_id UUID NOT NULL REFERENCES planets(id),
    
    -- Ships in this movement
    fighters INTEGER DEFAULT 0,
    bombers INTEGER DEFAULT 0,
    cruisers INTEGER DEFAULT 0,
    battleships INTEGER DEFAULT 0,
    transporters INTEGER DEFAULT 0,
    spy_probes INTEGER DEFAULT 0,
    
    -- Cargo
    cargo_metal DECIMAL(20,2) DEFAULT 0,
    cargo_crystal DECIMAL(20,2) DEFAULT 0,
    cargo_deuterium DECIMAL(20,2) DEFAULT 0,
    
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    return_time TIMESTAMPTZ,
    is_returning BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'traveling' CHECK (status IN ('traveling', 'arrived', 'returning', 'completed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fleet_movements_owner ON fleet_movements(owner_id);
CREATE INDEX idx_fleet_movements_destination ON fleet_movements(destination_planet_id);
CREATE INDEX idx_fleet_movements_arrival ON fleet_movements(arrival_time);
CREATE INDEX idx_fleet_movements_status ON fleet_movements(status) WHERE status != 'completed';

-- ================================================
-- 9. COMBAT REPORTS TABLE
-- ================================================
CREATE TABLE combat_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attacker_id UUID NOT NULL REFERENCES users(id),
    defender_id UUID NOT NULL REFERENCES users(id),
    planet_id UUID NOT NULL REFERENCES planets(id),
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Store battle data as JSONB for flexibility
    attacker_ships JSONB NOT NULL,
    defender_ships JSONB NOT NULL,
    defender_defenses JSONB,
    attacker_losses JSONB NOT NULL,
    defender_losses JSONB NOT NULL,
    
    winner VARCHAR(20) NOT NULL CHECK (winner IN ('attacker', 'defender', 'draw')),
    loot JSONB,
    debris JSONB,
    
    is_read_attacker BOOLEAN DEFAULT FALSE,
    is_read_defender BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_combat_reports_attacker ON combat_reports(attacker_id);
CREATE INDEX idx_combat_reports_defender ON combat_reports(defender_id);
CREATE INDEX idx_combat_reports_occurred ON combat_reports(occurred_at DESC);

-- ================================================
-- 10. ALLIANCE MESSAGES TABLE
-- ================================================
CREATE TABLE alliance_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id UUID NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alliance_messages_alliance ON alliance_messages(alliance_id);
CREATE INDEX idx_alliance_messages_created ON alliance_messages(created_at DESC);

-- ================================================
-- 11. SHARED STORAGE TABLE
-- ================================================
CREATE TABLE shared_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id UUID UNIQUE NOT NULL REFERENCES alliances(id) ON DELETE CASCADE,
    metal DECIMAL(20,2) DEFAULT 0,
    crystal DECIMAL(20,2) DEFAULT 0,
    deuterium DECIMAL(20,2) DEFAULT 0,
    rare_earth DECIMAL(20,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 12. MARKET OFFERS TABLE
-- ================================================
CREATE TABLE market_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_name VARCHAR(255) NOT NULL,
    
    offer_resource VARCHAR(20) NOT NULL CHECK (offer_resource IN ('metal', 'crystal', 'deuterium', 'rare_earth')),
    offer_amount DECIMAL(20,2) NOT NULL,
    
    request_resource VARCHAR(20) NOT NULL CHECK (request_resource IN ('metal', 'crystal', 'deuterium', 'rare_earth')),
    request_amount DECIMAL(20,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired'))
);

CREATE INDEX idx_market_offers_seller ON market_offers(seller_id);
CREATE INDEX idx_market_offers_status ON market_offers(status) WHERE status = 'active';
CREATE INDEX idx_market_offers_resources ON market_offers(offer_resource, request_resource);

-- ================================================
-- 13. TRADE TRANSACTIONS TABLE
-- ================================================
CREATE TABLE trade_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES market_offers(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    
    metal DECIMAL(20,2) DEFAULT 0,
    crystal DECIMAL(20,2) DEFAULT 0,
    deuterium DECIMAL(20,2) DEFAULT 0,
    rare_earth DECIMAL(20,2) DEFAULT 0,
    
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'delivered'))
);

CREATE INDEX idx_trade_transactions_sender ON trade_transactions(sender_id);
CREATE INDEX idx_trade_transactions_receiver ON trade_transactions(receiver_id);
CREATE INDEX idx_trade_transactions_arrival ON trade_transactions(arrival_time);

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to update resources based on time passed
CREATE OR REPLACE FUNCTION update_planet_resources(p_planet_id UUID)
RETURNS void AS $$
DECLARE
    v_last_updated TIMESTAMPTZ;
    v_hours_passed DECIMAL;
    v_metal_prod DECIMAL;
    v_crystal_prod DECIMAL;
    v_deuterium_prod DECIMAL;
    v_metal_cap DECIMAL;
    v_crystal_cap DECIMAL;
    v_deuterium_cap DECIMAL;
BEGIN
    SELECT 
        last_updated, 
        metal_production, 
        crystal_production, 
        deuterium_production,
        metal_capacity,
        crystal_capacity,
        deuterium_capacity
    INTO 
        v_last_updated, 
        v_metal_prod, 
        v_crystal_prod, 
        v_deuterium_prod,
        v_metal_cap,
        v_crystal_cap,
        v_deuterium_cap
    FROM planet_resources 
    WHERE planet_id = p_planet_id;
    
    v_hours_passed := EXTRACT(EPOCH FROM (NOW() - v_last_updated)) / 3600;
    
    UPDATE planet_resources
    SET 
        metal = LEAST(metal + (v_metal_prod * v_hours_passed), v_metal_cap),
        crystal = LEAST(crystal + (v_crystal_prod * v_hours_passed), v_crystal_cap),
        deuterium = LEAST(deuterium + (v_deuterium_prod * v_hours_passed), v_deuterium_cap),
        last_updated = NOW()
    WHERE planet_id = p_planet_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (for game data)
CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read on planets" ON planets FOR SELECT USING (true);
CREATE POLICY "Allow public read on alliances" ON alliances FOR SELECT USING (true);
CREATE POLICY "Allow public read on market_offers" ON market_offers FOR SELECT USING (true);

-- Policies for authenticated updates (will be refined with proper auth)
CREATE POLICY "Allow all on planet_resources" ON planet_resources FOR ALL USING (true);
CREATE POLICY "Allow all on buildings" ON buildings FOR ALL USING (true);
CREATE POLICY "Allow all on fleets" ON fleets FOR ALL USING (true);
CREATE POLICY "Allow all on fleet_movements" ON fleet_movements FOR ALL USING (true);
CREATE POLICY "Allow all on combat_reports" ON combat_reports FOR ALL USING (true);
CREATE POLICY "Allow all on alliance_members" ON alliance_members FOR ALL USING (true);
CREATE POLICY "Allow all on alliance_messages" ON alliance_messages FOR ALL USING (true);
CREATE POLICY "Allow all on shared_storage" ON shared_storage FOR ALL USING (true);
CREATE POLICY "Allow all on trade_transactions" ON trade_transactions FOR ALL USING (true);

-- ================================================
-- SEED DATA: Generate Starter Planets
-- ================================================

-- Insert 100 starter planets in a grid pattern
INSERT INTO planets (name, type, position_x, position_y, is_starter, size, metal_bonus, crystal_bonus, deuterium_bonus, energy_bonus)
SELECT 
    'Terra-' || (row_number() OVER ())::text,
    'terra',
    ((row_number() OVER () - 1) % 10) * 100 + (random() * 50)::int,
    ((row_number() OVER () - 1) / 10) * 100 + (random() * 50)::int,
    true,
    140 + (random() * 20)::int,
    1.00,
    1.00,
    1.00,
    1.00
FROM generate_series(1, 100);

-- Insert some special planets (non-starter)
INSERT INTO planets (name, type, position_x, position_y, is_starter, size, metal_bonus, crystal_bonus, deuterium_bonus, energy_bonus, rare_earth_bonus)
VALUES
    ('Vulkan Prime', 'volcano', 500, 500, false, 200, 1.40, 0.80, 0.70, 0.80, 0.50),
    ('Eismond Alpha', 'ice', 300, 700, false, 120, 0.80, 1.00, 1.50, 0.60, 0.30),
    ('Wüstenwelt Zeta', 'desert', 700, 300, false, 180, 1.00, 0.80, 0.60, 1.30, 0.40),
    ('Gasriese Omega', 'gas_giant', 900, 900, false, 300, 0.00, 0.00, 2.00, 0.50, 0.00),
    ('Asteroid X-7', 'asteroid', 150, 850, false, 60, 1.20, 1.20, 0.30, 0.30, 2.00);
