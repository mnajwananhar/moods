"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Brain,
  TrendingUp,
  Heart,
  Clock,
  Users,
  Award,
  BarChart3,
  Utensils,
  Target,
  Star,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";

interface DashboardStats {
  totalAssessments: number;
  streakDays: number;
  totalPoints: number;
  level: number;
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
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { error } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalAssessments: 0,
    streakDays: 0,
    totalPoints: 0,
    level: 1,
    favoriteFoods: 0,
    recentMood: "energizing",
  });

  const [recentAssessments, setRecentAssessments] = useState<
    RecentAssessment[]
  >([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      // Load user stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

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
        streakDays: profile?.streak_days || 0,
        totalPoints: profile?.total_points || 0,
        level: profile?.level || 1,
        favoriteFoods: likedFoodsCount || 0,
        recentMood: assessments?.[0]?.predicted_mood || "energizing",
      });
      setRecentAssessments(assessments || []);
      // Transform posts data to match CommunityPost interface
      const transformedPosts: CommunityPost[] = (posts || []).map(
        (post: {
          id: string;
          title: string;
          type: string;
          likes_count: number;
          created_at: string;
          profiles: { full_name: string }[];
        }) => ({
          id: post.id,
          title: post.title,
          type: post.type,
          likes_count: post.likes_count,
          created_at: post.created_at,
          profiles: {
            full_name:
              Array.isArray(post.profiles) && post.profiles[0]?.full_name
                ? post.profiles[0].full_name
                : "Anonymous",
          },
        })
      );

      setCommunityPosts(transformedPosts);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      error("Gagal Memuat Data", "Terjadi kesalahan saat memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, error]);
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const getLevelProgress = () => {
    const currentLevelPoints = stats.totalPoints % 1000;
    const nextLevelPoints = 1000;
    return (currentLevelPoints / nextLevelPoints) * 100;
  };

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
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-700">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-forest-900">
                Selamat datang,{" "}
                {user?.user_metadata?.full_name?.split(" ")[0] || "User"}! 👋
              </h1>
              <p className="text-sage-700 mt-2">
                Mari lihat perkembangan kesehatan dan mood Anda hari ini.
              </p>
            </div>
            <Link
              href="/recommendations/assessment"
              className="bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Analisis Baru
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-2xl">{getMoodEmoji(stats.recentMood)}</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.totalAssessments}
            </div>
            <div className="text-sage-600 text-sm">Total Analisis</div>
            <div className="text-xs text-sage-500 mt-1">
              Mood terakhir: {stats.recentMood}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.streakDays}
            </div>
            <div className="text-sage-600 text-sm">Hari Berturut</div>
            <div className="text-xs text-sage-500 mt-1">
              Konsistensi analisis
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.totalPoints}
            </div>
            <div className="text-sage-600 text-sm">Total Poin</div>
            <div className="text-xs text-sage-500 mt-1">
              Level {stats.level}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-2xl">❤️</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.favoriteFoods}
            </div>
            <div className="text-sage-600 text-sm">Makanan Favorit</div>
            <div className="text-xs text-sage-500 mt-1">Yang sudah dilike</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Level Progress */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-forest-900">
                  Progress Level
                </h3>
                <div className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm font-medium">
                  Level {stats.level}
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-sage-600 mb-2">
                  <span>{stats.totalPoints % 1000} / 1000 poin</span>
                  <span>{Math.round(getLevelProgress())}%</span>
                </div>
                <div className="w-full bg-sage-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-forest-500 to-forest-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
              </div>
              <p className="text-sage-600 text-sm">
                {1000 - (stats.totalPoints % 1000)} poin lagi untuk naik ke
                level {stats.level + 1}!
              </p>
            </div>

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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getMoodEmoji(assessment.predicted_mood)}
                          </span>
                          <div>
                            <div className="font-semibold text-forest-900 capitalize">
                              {assessment.predicted_mood}
                            </div>
                            <div className="text-sm text-sage-600">
                              Confidence:{" "}
                              {(assessment.confidence_score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-sage-500">
                            {new Date(assessment.created_at).toLocaleDateString(
                              "id-ID"
                            )}
                          </div>
                          <div className="text-xs text-sage-400">
                            {new Date(assessment.created_at).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-sage-400 mb-4" />
                  <p className="text-sage-600 mb-4">Belum ada analisis</p>
                  <Link
                    href="/recommendations/assessment"
                    className="bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors"
                  >
                    Mulai Analisis Pertama
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
              <h3 className="text-xl font-bold text-forest-900 mb-6">
                Aksi Cepat
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/recommendations/assessment"
                  className="group bg-gradient-to-r from-forest-500 to-forest-600 text-white p-4 rounded-xl hover:from-forest-600 hover:to-forest-700 transition-all duration-200"
                >
                  <Brain className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">Analisis Nutrisi</h4>
                  <p className="text-sm opacity-90">
                    Dapatkan rekomendasi makanan
                  </p>
                </Link>

                <Link
                  href="/community"
                  className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  <Users className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">Komunitas</h4>
                  <p className="text-sm opacity-90">
                    Berbagi dengan pengguna lain
                  </p>
                </Link>

                <Link
                  href="/learn"
                  className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  <BarChart3 className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">Edukasi</h4>
                  <p className="text-sm opacity-90">Pelajari nutrisi & mood</p>
                </Link>

                <Link
                  href="/profile/analytics"
                  className="group bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200"
                >
                  <TrendingUp className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold mb-1">Analytics</h4>
                  <p className="text-sm opacity-90">
                    Lihat tren kesehatan Anda
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Today's Tips */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
              <h3 className="text-xl font-bold text-forest-900 mb-4">
                Tips Hari Ini
              </h3>
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Utensils className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-900">
                      Nutrisi Seimbang
                    </h4>
                  </div>
                  <p className="text-orange-800 text-sm">
                    Pastikan makan mengandung protein, karbohidrat, dan lemak
                    sehat untuk mood stabil.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">
                      Waktu Makan
                    </h4>
                  </div>
                  <p className="text-green-800 text-sm">
                    Makan teratur setiap 3-4 jam membantu menjaga energi dan
                    mood sepanjang hari.
                  </p>
                </div>
              </div>
            </div>

            {/* Community Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-forest-900">
                  Aktivitas Komunitas
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
                <div className="space-y-3">
                  {communityPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className="border-b border-sage-100 pb-3 last:border-b-0"
                    >
                      <h4 className="font-medium text-forest-900 text-sm mb-1">
                        {post.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-sage-600">
                        <span>{post.profiles?.full_name || "Anonymous"}</span>
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3" />
                          <span>{post.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 mx-auto text-sage-400 mb-2" />
                  <p className="text-sage-600 text-sm">Belum ada aktivitas</p>
                </div>
              )}
            </div>

            {/* Achievement */}
            <div className="bg-gradient-to-r from-forest-600 to-forest-700 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8" />
                <h3 className="text-xl font-bold">Achievement</h3>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-2">🎯 Konsisten Analyst</h4>
                <p className="text-forest-100 text-sm">
                  Lakukan analisis nutrisi selama 7 hari berturut-turut untuk
                  mendapatkan badge ini!
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-forest-200">Progress:</span>
                <span className="font-bold">{stats.streakDays}/7 hari</span>
              </div>
              <div className="w-full bg-forest-500 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((stats.streakDays / 7) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
