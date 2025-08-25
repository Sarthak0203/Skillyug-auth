-- CORRECTED Live streaming tables schema
-- This fixes the foreign key references to use user_profiles instead of profiles

-- Table for active live streams
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  stream_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for recorded streams  
CREATE TABLE IF NOT EXISTS recorded_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cloudinary_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- duration in seconds
  file_size BIGINT, -- file size in bytes
  quality TEXT DEFAULT 'HD', -- HD, SD, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table for stream viewers/participants (optional for analytics)
CREATE TABLE IF NOT EXISTS stream_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_watched INTEGER DEFAULT 0, -- in seconds
  UNIQUE(stream_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_streams_active ON live_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_by ON live_streams(created_by);
CREATE INDEX IF NOT EXISTS idx_recorded_streams_created_by ON recorded_streams(created_by);
CREATE INDEX IF NOT EXISTS idx_recorded_streams_created_at ON recorded_streams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_participants_stream_id ON stream_participants(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_participants_user_id ON stream_participants(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorded_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_participants ENABLE ROW LEVEL SECURITY;

-- Live streams policies
CREATE POLICY "Users can view all active live streams" ON live_streams
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only instructors and admins can create live streams" ON live_streams
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE user_type IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Only creators can update their own live streams" ON live_streams
  FOR UPDATE USING (
    auth.uid() = created_by AND 
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE user_type IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Only creators can delete their own live streams" ON live_streams
  FOR DELETE USING (
    auth.uid() = created_by AND 
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE user_type IN ('instructor', 'admin')
    )
  );

-- Recorded streams policies
CREATE POLICY "Users can view all recorded streams" ON recorded_streams
  FOR SELECT USING (true);

CREATE POLICY "Only instructors and admins can create recorded streams" ON recorded_streams
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE user_type IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Only creators can update their own recorded streams" ON recorded_streams
  FOR UPDATE USING (
    auth.uid() = created_by AND 
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE user_type IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Only creators can delete their own recorded streams" ON recorded_streams
  FOR DELETE USING (
    auth.uid() = created_by AND 
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE user_type IN ('instructor', 'admin')
    )
  );

-- Stream participants policies
CREATE POLICY "Users can view stream participants" ON stream_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own participation records" ON stream_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation records" ON stream_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_live_streams_updated_at ON live_streams;
CREATE TRIGGER update_live_streams_updated_at 
  BEFORE UPDATE ON live_streams 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_recorded_streams_updated_at ON recorded_streams;
CREATE TRIGGER update_recorded_streams_updated_at 
  BEFORE UPDATE ON recorded_streams 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Grant permissions
GRANT ALL ON live_streams TO authenticated;
GRANT ALL ON recorded_streams TO authenticated;
GRANT ALL ON stream_participants TO authenticated;
GRANT SELECT ON live_streams TO anon;
GRANT SELECT ON recorded_streams TO anon;
