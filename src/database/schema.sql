-- ============================================================================
-- NutriMood Database Schema
-- Complete database structure for the NutriMood application
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER MANAGEMENT TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  location TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT valid_age CHECK (age > 0 AND age < 150)
);

-- Health profiles for dietary restrictions and health conditions
CREATE TABLE IF NOT EXISTS health_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  health_conditions TEXT[],
  allergies TEXT[],
  dietary_preferences TEXT[],
  health_goals TEXT[],
  medications TEXT[],
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY ON DELETE CASCADE,
  daily_reminder BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  community_notifications BOOLEAN DEFAULT TRUE,
  educational_tips BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'id' CHECK (language IN ('id', 'en')),
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'friends')),
  notification_time TIME DEFAULT '09:00:00',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION & ASSESSMENT TABLES
-- ============================================================================

-- Nutrition assessments (core feature)
CREATE TABLE IF NOT EXISTS nutrition_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  calorie_level INTEGER NOT NULL CHECK (calorie_level >= 0 AND calorie_level <= 3),
  protein_level INTEGER NOT NULL CHECK (protein_level >= 0 AND protein_level <= 3),
  fat_level INTEGER NOT NULL CHECK (fat_level >= 0 AND fat_level <= 3),
  carb_level INTEGER NOT NULL CHECK (carb_level >= 0 AND carb_level <= 3),
  predicted_mood TEXT NOT NULL,
  confidence_score DECIMAL(4,3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_assessments_user_date (user_id, created_at),
  INDEX idx_assessments_mood (predicted_mood)
);

-- Foods database (1,346+ Indonesian foods)
CREATE TABLE IF NOT EXISTS foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  calories DECIMAL(8,2) NOT NULL CHECK (calories >= 0),
  proteins DECIMAL(8,2) NOT NULL CHECK (proteins >= 0),
  fats DECIMAL(8,2) NOT NULL CHECK (fats >= 0),
  carbohydrates DECIMAL(8,2) NOT NULL CHECK (carbohydrates >= 0),
  vitamin_a DECIMAL(8,2) DEFAULT 0,
  vitamin_c DECIMAL(8,2) DEFAULT 0,
  vitamin_b DECIMAL(8,2) DEFAULT 0,
  iron DECIMAL(8,2) DEFAULT 0,
  calcium DECIMAL(8,2) DEFAULT 0,
  fiber DECIMAL(8,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  sugar DECIMAL(8,2) DEFAULT 0,
  image_url TEXT,
  description TEXT,
  origin_region TEXT,
  category TEXT,
  subcategory TEXT,
  serving_size TEXT,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  is_vegan BOOLEAN DEFAULT FALSE,
  is_halal BOOLEAN DEFAULT TRUE,
  is_gluten_free BOOLEAN DEFAULT FALSE,
  preparation_time INTEGER, -- in minutes
  cooking_difficulty TEXT CHECK (cooking_difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_foods_name (name),
  INDEX idx_foods_category (category),
  INDEX idx_foods_nutrition (calories, proteins, fats, carbohydrates)
);

-- Food recommendations from ML model
CREATE TABLE IF NOT EXISTS food_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assessment_id UUID REFERENCES nutrition_assessments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  food_name TEXT NOT NULL, -- Stored for historical purposes
  calories DECIMAL(8,2) NOT NULL,
  proteins DECIMAL(8,2) NOT NULL,
  fats DECIMAL(8,2) NOT NULL,
  carbohydrates DECIMAL(8,2) NOT NULL,
  mood_category TEXT NOT NULL,
  similarity_score DECIMAL(4,3) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
  is_liked BOOLEAN DEFAULT FALSE,
  is_consumed BOOLEAN DEFAULT FALSE,
  consumed_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_recommendations_user (user_id),
  INDEX idx_recommendations_assessment (assessment_id),
  INDEX idx_recommendations_food (food_id)
);

-- ============================================================================
-- COMMUNITY TABLES
-- ============================================================================

-- Community posts (recipes, stories, questions, tips, reviews)
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recipe', 'story', 'question', 'tip', 'review')),
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  tags TEXT[],
  food_name TEXT, -- For reviews
  food_id UUID REFERENCES foods(id), -- Link to foods table
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- For reviews
  recipe_ingredients JSONB, -- Structured recipe data
  recipe_instructions JSONB, -- Step-by-step instructions
  preparation_time INTEGER, -- For recipes
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  serving_size INTEGER,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE, -- For expert posts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_posts_user (user_id),
  INDEX idx_posts_type (type),
  INDEX idx_posts_created (created_at),
  INDEX idx_posts_featured (is_featured, created_at)
);

-- Post likes system
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, post_id),
  INDEX idx_likes_post (post_id),
  INDEX idx_likes_user (user_id)
);

-- Comments system with nested support
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested comments
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_comments_post (post_id, created_at),
  INDEX idx_comments_user (user_id),
  INDEX idx_comments_parent (parent_id)
);

-- ============================================================================
-- EDUCATION TABLES
-- ============================================================================

-- Educational articles and content
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL, -- nutrition-basics, mood-food, etc.
  subcategory TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT, -- For guest authors
  author_credentials TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  reading_time INTEGER, -- Estimated reading time in minutes
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_articles_category (category, published_at),
  INDEX idx_articles_slug (slug),
  INDEX idx_articles_featured (is_featured, published_at)
);

-- Learning courses and paths
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER, -- Total minutes
  lessons_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  instructor_id UUID REFERENCES profiles(id),
  instructor_name TEXT,
  course_image TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2) DEFAULT 0, -- For future premium courses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_courses_category (category),
  INDEX idx_courses_difficulty (difficulty)
);

-- ============================================================================
-- UTILITY TABLES
-- ============================================================================

-- Bookmarks/Favorites
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'recipe', 'food', 'post', 'course')),
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, item_type, item_id),
  INDEX idx_bookmarks_user (user_id),
  INDEX idx_bookmarks_type (item_type)
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- daily_reminder, challenge_update, community_mention, etc.
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  action_type TEXT, -- redirect, api_call, etc.
  data JSONB, -- Additional structured data
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_notifications_user (user_id, is_read, created_at),
  INDEX idx_notifications_type (type)
);

-- User analytics and tracking
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- assessment, recommendation_view, food_like, etc.
  event_category TEXT, -- engagement, nutrition, community
  event_data JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_analytics_user (user_id, created_at),
  INDEX idx_analytics_event (event_type, created_at)
);

-- Feedback and support system
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature_request', 'general', 'complaint', 'compliment')),
  category TEXT,
  title TEXT,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_response TEXT,
  admin_id UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_feedback_user (user_id),
  INDEX idx_feedback_status (status, priority)
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Nutrition assessments policies
CREATE POLICY "Users can view own assessments" ON nutrition_assessments
  FOR ALL USING (auth.uid() = user_id);

-- Food recommendations policies
CREATE POLICY "Users can view own recommendations" ON food_recommendations
  FOR ALL USING (auth.uid() = user_id);

-- Community posts policies
CREATE POLICY "Public posts are viewable by everyone" ON community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Users can manage own likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- User-specific data policies
CREATE POLICY "Users can manage own health profiles" ON health_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment/decrement counters
CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE community_posts 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total points and level based on activities
    -- This is a simplified version - can be expanded
    IF TG_TABLE_NAME = 'nutrition_assessments' THEN
        UPDATE profiles 
        SET total_points = total_points + 5,
            level = GREATEST(1, (total_points + 5) / 1000 + 1)
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply stats trigger
CREATE TRIGGER update_user_stats_on_assessment 
    AFTER INSERT ON nutrition_assessments
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert sample articles
INSERT INTO articles (title, slug, content, excerpt, category, reading_time, is_published) VALUES
('Dasar-Dasar Nutrisi untuk Pemula', 'dasar-nutrisi-pemula', 'Artikel lengkap tentang dasar-dasar nutrisi...', 'Pelajari konsep dasar nutrisi yang perlu diketahui setiap orang', 'nutrition-basics', 8, true),
('Bagaimana Makanan Mempengaruhi Mood', 'makanan-dan-mood', 'Penjelasan ilmiah tentang hubungan makanan dan mood...', 'Temukan bagaimana pilihan makanan dapat mempengaruhi suasana hati Anda', 'mood-food', 6, true),
('10 Makanan Indonesia Terbaik untuk Energi', 'makanan-indonesia-energi', 'Daftar makanan tradisional Indonesia yang memberikan energi...', 'Makanan lokal yang dapat meningkatkan energi dan stamina Anda', 'indonesian-foods', 5, true);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for user dashboard stats
CREATE VIEW user_dashboard_stats AS
SELECT 
    p.id,
    p.full_name,
    p.total_points,
    p.level,
    COUNT(na.id) as total_assessments,
    COUNT(CASE WHEN fr.is_liked = true THEN 1 END) as favorite_foods,
    COALESCE(na_recent.predicted_mood, 'none') as recent_mood
FROM profiles p
LEFT JOIN nutrition_assessments na ON p.id = na.user_id
LEFT JOIN food_recommendations fr ON p.id = fr.user_id
LEFT JOIN LATERAL (
    SELECT predicted_mood 
    FROM nutrition_assessments 
    WHERE user_id = p.id 
    ORDER BY created_at DESC 
    LIMIT 1
) na_recent ON true
GROUP BY p.id, p.full_name, p.total_points, p.level, na_recent.predicted_mood;

-- View for community activity
CREATE VIEW community_activity AS
SELECT 
    cp.id,
    cp.title,
    cp.type,
    cp.likes_count,
    cp.comments_count,
    cp.created_at,
    p.full_name as author_name,
    p.avatar_url as author_avatar
FROM community_posts cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.is_featured = true OR cp.likes_count > 10
ORDER BY cp.created_at DESC;

-- ============================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Additional indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_user_created 
    ON nutrition_assessments(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recommendations_user_liked 
    ON food_recommendations(user_id, is_liked) WHERE is_liked = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_featured_created 
    ON community_posts(is_featured, created_at DESC) WHERE is_featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_foods_search 
    ON foods USING gin(to_tsvector('indonesian', name || ' ' || COALESCE(description, '')));

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_type_created 
    ON community_posts(type, created_at DESC);

-- ============================================================================
-- CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to clean old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND is_read = true;
    
    DELETE FROM user_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (would be run via cron job or scheduled function)
-- SELECT cleanup_old_notifications();

-- ============================================================================
-- FINAL COMMENTS
-- ============================================================================

/*
This schema provides:

1. Complete user management with profiles, health data, and preferences
2. Core nutrition assessment and ML recommendation functionality  
3. Full-featured community system with posts, likes, comments
4. Educational content management
5. Analytics and tracking capabilities
6. Proper security with RLS policies
7. Performance optimizations with strategic indexes
8. Maintenance and cleanup procedures

To deploy:
1. Run this schema in your Supabase SQL editor
2. Insert your food database (1,346+ Indonesian foods)
3. Configure storage buckets for images
4. Set up authentication providers
5. Deploy the Next.js application

The schema is designed to scale and can handle thousands of users
with proper performance characteristics.
*/