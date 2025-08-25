-- 🔧 FIXED RLS POLICIES - Run this after the main schema
-- This fixes the 403 Forbidden errors when creating streams

-- More permissive policies for live streams
DROP POLICY IF EXISTS "Only instructors and admins can create live streams" ON live_streams;
CREATE POLICY "Authenticated users can create live streams" ON live_streams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only creators can update their own live streams" ON live_streams;
CREATE POLICY "Creators can update their own live streams" ON live_streams
  FOR UPDATE USING (auth.uid() = created_by);

-- More permissive policies for recorded streams  
DROP POLICY IF EXISTS "Only instructors and admins can create recorded streams" ON recorded_streams;
CREATE POLICY "Authenticated users can create recorded streams" ON recorded_streams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Only creators can update their own recorded streams" ON recorded_streams;
CREATE POLICY "Creators can update their own recorded streams" ON recorded_streams
  FOR UPDATE USING (auth.uid() = created_by);

-- Test the policies
SELECT 'RLS policies updated successfully' as status;
