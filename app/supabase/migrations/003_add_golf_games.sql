-- Add new golf game formats: Wolf, Best Ball, Bingo Bango Bongo

-- ============================================
-- UPDATE GAME FORMAT ENUM
-- ============================================

-- Add new game formats to the enum
ALTER TYPE game_format ADD VALUE 'wolf';
ALTER TYPE game_format ADD VALUE 'best_ball';
ALTER TYPE game_format ADD VALUE 'bingo_bango_bongo';

-- ============================================
-- ADD NEW CONFIG FIELDS
-- ============================================

-- Wolf config fields
ALTER TABLE game_configs ADD COLUMN wolf_value DECIMAL(10,2);
ALTER TABLE game_configs ADD COLUMN lone_wolf_multiplier SMALLINT DEFAULT 2;
ALTER TABLE game_configs ADD COLUMN blind_wolf_multiplier SMALLINT DEFAULT 3;

-- Best Ball config fields
ALTER TABLE game_configs ADD COLUMN best_ball_bet DECIMAL(10,2);

-- Bingo Bango Bongo config fields
ALTER TABLE game_configs ADD COLUMN bingo_value DECIMAL(10,2);
ALTER TABLE game_configs ADD COLUMN bango_value DECIMAL(10,2);
ALTER TABLE game_configs ADD COLUMN bongo_value DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN game_configs.wolf_value IS 'Value per point in Wolf game';
COMMENT ON COLUMN game_configs.lone_wolf_multiplier IS 'Multiplier when wolf goes alone against 3 (default 2x)';
COMMENT ON COLUMN game_configs.blind_wolf_multiplier IS 'Multiplier when wolf declares alone before seeing shots (default 3x)';
COMMENT ON COLUMN game_configs.best_ball_bet IS 'Bet per team in Best Ball format';
COMMENT ON COLUMN game_configs.bingo_value IS 'Bingo Bango Bongo: value for first on green';
COMMENT ON COLUMN game_configs.bango_value IS 'Bingo Bango Bongo: value for closest to pin when all on green';
COMMENT ON COLUMN game_configs.bongo_value IS 'Bingo Bango Bongo: value for first in hole';
