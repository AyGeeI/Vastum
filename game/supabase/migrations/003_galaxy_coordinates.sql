-- ========================================
-- Galaxy Coordinate System Migration
-- ========================================

-- Add galaxy coordinates to planets table
ALTER TABLE planets ADD COLUMN IF NOT EXISTS galaxy INT DEFAULT 1;
ALTER TABLE planets ADD COLUMN IF NOT EXISTS sector INT;
ALTER TABLE planets ADD COLUMN IF NOT EXISTS system_pos INT;
ALTER TABLE planets ADD COLUMN IF NOT EXISTS planet_pos INT;

-- Create index for fast coordinate lookups
CREATE INDEX IF NOT EXISTS idx_planets_coordinates 
ON planets(galaxy, sector, system_pos, planet_pos);

-- Create index for finding planets by sector
CREATE INDEX IF NOT EXISTS idx_planets_sector 
ON planets(galaxy, sector);

-- Update existing planets with random coordinates
UPDATE planets 
SET 
    galaxy = 1,
    sector = FLOOR(RANDOM() * 25) + 1,
    system_pos = FLOOR(RANDOM() * 100) + 1,
    planet_pos = FLOOR(RANDOM() * 15) + 1
WHERE sector IS NULL;

-- Generate some uncolonized planets for exploration
INSERT INTO planets (name, type, position_x, position_y, size, temperature, is_starter, metal_bonus, crystal_bonus, deuterium_bonus, energy_bonus, rare_earth_bonus, galaxy, sector, system_pos, planet_pos)
SELECT 
    'Unbekannter Planet ' || generate_series,
    (ARRAY['terra', 'desert', 'ice', 'volcano', 'asteroid'])[FLOOR(RANDOM() * 5) + 1]::text,
    FLOOR(RANDOM() * 1000),
    FLOOR(RANDOM() * 1000),
    50 + FLOOR(RANDOM() * 150),
    -50 + FLOOR(RANDOM() * 150),
    false,
    0.8 + RANDOM() * 0.4,
    0.8 + RANDOM() * 0.4,
    0.8 + RANDOM() * 0.4,
    0.8 + RANDOM() * 0.4,
    0.8 + RANDOM() * 0.4,
    1,
    FLOOR(RANDOM() * 25) + 1,
    FLOOR(RANDOM() * 100) + 1,
    FLOOR(RANDOM() * 15) + 1
FROM generate_series(1, 100);
