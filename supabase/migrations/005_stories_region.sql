-- Add region column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS region text DEFAULT 'GLB';

-- Create index for region filtering
CREATE INDEX IF NOT EXISTS idx_stories_region ON stories(region);

-- Create trigger to auto-set region on stories based on source region mapping
-- This will run when a new story is created
CREATE OR REPLACE FUNCTION set_story_region()
RETURNS TRIGGER AS $$
BEGIN
  -- If region is null, set default to GLB
  IF NEW.region IS NULL THEN
    NEW.region := 'GLB';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stories_region_trigger ON stories;
CREATE TRIGGER stories_region_trigger
  BEFORE INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION set_story_region();

-- Update existing stories with region based on their source
-- We'll set region='SAM' for Brazil-based sources by default (most stories are Brazilian)
UPDATE stories SET region = 'SAM' WHERE region IS NULL;