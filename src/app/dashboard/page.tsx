"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TrendingUp, Heart, Users, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";

interface DashboardStats {
  totalAssessments: number;
  favoriteFoods: number;
  recentMood: string;
}

interface RecentAssessment {
  id: string;
  created_at: string;
  predicted_mood: string;
  confidence_score: number;
}

interface CommunityPost {
  id: string;
  title: string;
  type: string;
  likes_count: number;
  created_at: string;
  profiles: {
    full_name: string;
  }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { error } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalAssessments: 0,
    favoriteFoods: 0,
    recentMood: "",
  });

  const [recentAssessments, setRecentAssessments] = useState<
    RecentAssessment[]
  >([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      // Load assessments
      const { data: assessments } = await supabase
        .from("nutrition_assessments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Load liked foods count
      const { count: likedFoodsCount } = await supabase
        .from("food_recommendations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user?.id)
        .eq("is_liked", true);

      // Load community posts
      const { data: posts } = await supabase
        .from("community_posts")
        .select(
          `
          id, title, type, likes_count, created_at,
          profiles(full_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalAssessments: assessments?.length || 0,
        favoriteFoods: likedFoodsCount || 0,
        recentMood: assessments?.[0]?.predicted_mood || "",
      });
      setRecentAssessments(assessments || []);
      setCommunityPosts(posts || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      error("Gagal Memuat Data", "Terjadi kesalahan saat memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, error]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      energizing: "⚡",
      calming: "😌",
      focusing: "🎯",
      relaxing: "😴",
      balanced: "⚖️",
    };
    return moodEmojis[mood] || "🍽️";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sage-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-700">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.totalAssessments}
            </div>
            <div className="text-sage-600 text-sm">Total Analisis</div>
            <div className="text-xs text-sage-500 mt-1">Sejak bergabung</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center mb-2">
              <Heart className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.favoriteFoods}
            </div>
            <div className="text-sage-600 text-sm">Makanan Favorit</div>
            <div className="text-xs text-sage-500 mt-1">Yang sudah dilike</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 flex flex-col items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-2xl font-bold text-forest-900 capitalize">
              {stats.recentMood || "-"}
            </div>
            <div className="text-sage-600 text-sm">Mood Terakhir</div>
            <div className="text-xs text-sage-500 mt-1">
              Dari analisis terbaru
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Assessments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-forest-900">
                Analisis Terbaru
              </h3>
              <Link
                href="/history"
                className="text-forest-600 hover:text-forest-700 font-medium text-sm flex items-center gap-1"
              >
                Lihat Semua
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {recentAssessments.length > 0 ? (
              <div className="space-y-4">
                {recentAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="bg-sage-50 rounded-xl p-4 border border-sage-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getMoodEmoji(assessment.predicted_mood)}
                      </span>
                      <div>
                        <div className="font-semibold text-forest-900 capitalize">
                          {assessment.predicted_mood}
                        </div>
                        <div className="text-xs text-sage-500">
                          {new Date(assessment.created_at).toLocaleString(
                            "id-ID",
                            { dateStyle: "medium", timeStyle: "short" }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sage-500 text-center py-8">
                Belum ada analisis.
              </div>
            )}
          </div>
          {/* Community Posts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-forest-900">
                Posting Komunitas Terbaru
              </h3>
              <Link
                href="/community"
                className="text-forest-600 hover:text-forest-700 font-medium text-sm flex items-center gap-1"
              >
                Lihat Semua
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {communityPosts.length > 0 ? (
              <div className="space-y-4">
                {communityPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-sage-50 rounded-xl p-4 border border-sage-200"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-forest-600" />
                      <div>
                        <div className="font-semibold text-forest-900">
                          {post.title}
                        </div>
                        <div className="text-xs text-sage-500">
                          {post.profiles?.[0]?.full_name || "Anonim"} •{" "}
                          {new Date(post.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sage-500 text-center py-8">
                Belum ada posting komunitas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
