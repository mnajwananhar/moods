export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  gender?: string;
  location?: string;
  joined_at: string;
  last_active: string;
  is_public: boolean;
  total_points: number;
  streak_days: number;
  level: number;
}

export interface HealthProfile {
  id: string;
  user_id: string;
  health_conditions?: string[];
  allergies?: string[];
  dietary_preferences?: string[];
  health_goals?: string[];
  medications?: string[];
  activity_level?: string;
  updated_at: string;
}

export interface NutritionAssessment {
  id: string;
  user_id: string;
  calorie_level: number; // 0-3
  protein_level: number; // 0-3
  fat_level: number; // 0-3
  carb_level: number; // 0-3
  predicted_mood: string;
  confidence_score: number;
  notes?: string;
  created_at: string;
}

export interface FoodRecommendation {
  id: string;
  assessment_id: string;
  user_id: string;
  food_name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
  mood_category: string;
  similarity_score: number;
  is_liked: boolean;
  is_consumed: boolean;
  consumed_at?: string;
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
  vitamin_a?: number;
  vitamin_c?: number;
  iron?: number;
  calcium?: number;
  image_url?: string;
  description?: string;
  origin_region?: string;
  category?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_halal: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  subcategory?: string;
  featured_image?: string;
  author_id?: string;
  is_featured: boolean;
  reading_time: number;
  views: number;
  likes: number;
  published_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  type: "recipe" | "story" | "question" | "tip" | "review";
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
  food_name?: string;
  rating?: number; // 1-5 for reviews
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: "weekly" | "daily" | "monthly";
  category: "nutrition" | "mood" | "community";
  start_date: string;
  end_date: string;
  reward_points: number;
  participant_count: number;
  is_active: boolean;
  created_at: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  target: number;
  completed: boolean;
  completed_at?: string;
  joined_at: string;
  challenges?: Challenge;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  description: string;
  earned_at: string;
}

export interface UserSettings {
  user_id: string;
  daily_reminder: boolean;
  weekly_summary: boolean;
  community_notifications: boolean;
  educational_tips: boolean;
  theme: "light" | "dark" | "auto";
  language: "id" | "en";
  privacy_level: "public" | "private" | "friends";
  notification_time: string;
  updated_at: string;
}
