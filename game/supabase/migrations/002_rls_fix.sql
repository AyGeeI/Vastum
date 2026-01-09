-- ================================================
-- VASTUM Database Schema - Complete RLS Fix
-- Run this to fix all RLS policies
-- ================================================

-- Drop all existing policies and recreate with full access for development
DO $$ 
BEGIN
    -- Users
    DROP POLICY IF EXISTS "Allow public read on users" ON users;
    DROP POLICY IF EXISTS "Allow all on users" ON users;
    DROP POLICY IF EXISTS "Allow insert on users" ON users;
    DROP POLICY IF EXISTS "Allow update on users" ON users;
    DROP POLICY IF EXISTS "Allow select on users" ON users;
    
    -- Planets
    DROP POLICY IF EXISTS "Planets are publicly readable" ON planets;
    DROP POLICY IF EXISTS "Allow public read on planets" ON planets;
    DROP POLICY IF EXISTS "Allow all on planets" ON planets;
    
    -- Planet resources
    DROP POLICY IF EXISTS "Planet resources readable by owner" ON planet_resources;
    DROP POLICY IF EXISTS "Allow all on planet_resources" ON planet_resources;
    
    -- Buildings
    DROP POLICY IF EXISTS "Buildings readable by owner" ON buildings;
    DROP POLICY IF EXISTS "Allow all on buildings" ON buildings;
END $$;

-- Create permissive policies for all tables (development mode)
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "planets_all" ON planets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "planet_resources_all" ON planet_resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "buildings_all" ON buildings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fleets_all" ON fleets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fleet_movements_all" ON fleet_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "combat_reports_all" ON combat_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "alliances_all" ON alliances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "alliance_members_all" ON alliance_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "alliance_messages_all" ON alliance_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "shared_storage_all" ON shared_storage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "market_offers_all" ON market_offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "trade_transactions_all" ON trade_transactions FOR ALL USING (true) WITH CHECK (true);
