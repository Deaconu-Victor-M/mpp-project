CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ALTER TABLE categories
-- ADD CONSTRAINT unique_category_name UNIQUE (name);

-- Insert default categories if they don't exist
INSERT INTO categories (name, color)
VALUES 
  ('AI', '#FF6B6B'),
  ('Gaming', '#4ECDC4'),
  ('Fintech', '#45B7D1'),
  ('Healthtech', '#96CEB4')

-- Create leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id),
    twitter_handle VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    follower_count INTEGER DEFAULT 0,
    last_post_date TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_blue_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- VIDEO (ignore for now)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filesize BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  thumbnail_url TEXT,
  upload_status TEXT DEFAULT 'processing',
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE POLICY "Allow public to list buckets"
ON storage.buckets
FOR SELECT
USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;
-- videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow uploads to videos bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow deleting video files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'videos');

CREATE POLICY "Allow all users to insert videos"
ON videos
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow all users to select videos"
ON videos
FOR SELECT
USING (true);

CREATE POLICY "Allow all users to update videos"
ON videos
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE INDEX idx_leads_category_id ON leads(category_id);


CREATE INDEX idx_leads_twitter_handle ON leads(twitter_handle);


CREATE INDEX idx_leads_follower_count ON leads(follower_count);


CREATE INDEX idx_leads_category_followers ON leads(category_id, follower_count);


CREATE INDEX idx_leads_created_at ON leads(created_at);


CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_upload_status ON videos(upload_status);