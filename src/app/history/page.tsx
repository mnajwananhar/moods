"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  TrendingUp,
  Brain,
  Utensils,
  Download,
  BarChart3,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";

interface NutritionAssessment {
  id: string;
  calorie_level: number;
  protein_level: number;
  fat_level: number;
  carb_level: number;
  predicted_mood: string;
  confidence_score: number;
  notes?: string;
  created_at: string;
  food_recommendations?: FoodRecommendation[];
}

interface FoodRecommendation {
  id: string;
  food_name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
  similarity_score: number;
  is_liked: boolean;
  is_consumed: boolean;
  consumed_at?: string;
}

interface MoodStats {
  totalAssessments: number;
  averageConfidence: number;
  moodDistribution: { [key: string]: number };
  streakDays: number;
  favoriteTime: string;
}

const getLevelLabelIndonesia = (level: number): string => {
  if (level <= 1) return "Sangat Rendah";
  if (level <= 2) return "Rendah";
  if (level <= 3) return "Sedang";
  if (level <= 4) return "Tinggi";
  return "Sangat Tinggi";
};

const getMoodEmoji = (mood: string): string => {
  const moodEmojis: { [key: string]: string } = {
    energizing: "⚡",
    calming: "😌",
    focusing: "🎯",
    relaxing: "😴",
    balanced: "⚖️",
  };
  return moodEmojis[mood] || "🍽️";
};

export default function HistoryPage() {
  const { user } = useAuth();
  const { error } = useToast();

  const [assessments, setAssessments] = useState<NutritionAssessment[]>([]);
  const [stats, setStats] = useState<MoodStats>({
    totalAssessments: 0,
    averageConfidence: 0,
    moodDistribution: {},
    streakDays: 0,
    favoriteTime: "",
  });
  const [loading, setLoading] = useState(true);

  type TabType = "assessments" | "analytics" | "foods";
  type TimeFilterType = "all" | "week" | "month" | "year";

  const [activeTab, setActiveTab] = useState<TabType>("assessments");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("all");
  const [moodFilter, setMoodFilter] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query based on filters
      let query = supabase
        .from("nutrition_assessments")
        .select(
          `
          *,
          food_recommendations (*)
        `
        )
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      // Apply time filter
      if (timeFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (timeFilter) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      // Apply mood filter
      if (moodFilter !== "all") {
        query = query.eq("predicted_mood", moodFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAssessments(data || []);

      // Calculate statistics
      if (data && data.length > 0) {
        const totalAssessments = data.length;
        const averageConfidence =
          data.reduce((sum, item) => sum + item.confidence_score, 0) /
          totalAssessments;

        // Calculate mood distribution
        const moodDistribution: { [key: string]: number } = {};
        data.forEach((item) => {
          moodDistribution[item.predicted_mood] =
            (moodDistribution[item.predicted_mood] || 0) + 1;
        });

        // Calculate streak (simplified)
        const streakDays = calculateStreakDays(data);

        // Find favorite time (simplified)
        const favoriteTime = findFavoriteTime(data);

        setStats({
          totalAssessments,
          averageConfidence,
          moodDistribution,
          streakDays,
          favoriteTime,
        });
      }
    } catch (err) {
      console.error("Error loading history:", err);
      error("Gagal memuat data riwayat");
    } finally {
      setLoading(false);
    }
  }, [user?.id, timeFilter, moodFilter, supabase, error]);

  const calculateStreakDays = (data: NutritionAssessment[]): number => {
    if (!data.length) return 0;

    const dates = data.map((item) => new Date(item.created_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort();

    let streak = 1;
    const today = new Date().toDateString();

    if (uniqueDates[0] !== today) return 0;

    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i - 1]);
      const next = new Date(uniqueDates[i]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const findFavoriteTime = (data: NutritionAssessment[]): string => {
    if (!data.length) return "";

    const timeSlots: { [key: string]: number } = {
      Pagi: 0,
      Siang: 0,
      Sore: 0,
      Malam: 0,
    };

    data.forEach((item) => {
      const hour = new Date(item.created_at).getHours();
      if (hour >= 5 && hour < 11) timeSlots["Pagi"]++;
      else if (hour >= 11 && hour < 15) timeSlots["Siang"]++;
      else if (hour >= 15 && hour < 19) timeSlots["Sore"]++;
      else timeSlots["Malam"]++;
    });

    return Object.entries(timeSlots).reduce((a, b) =>
      timeSlots[a[0]] > timeSlots[b[0]] ? a : b
    )[0];
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const exportData = async () => {
    try {
      const csvContent = assessments.map((assessment) => ({
        tanggal: new Date(assessment.created_at).toLocaleDateString("id-ID"),
        kalori: assessment.calorie_level,
        protein: assessment.protein_level,
        lemak: assessment.fat_level,
        karbohidrat: assessment.carb_level,
        mood_prediksi: assessment.predicted_mood,
        akurasi: (assessment.confidence_score * 100).toFixed(1) + "%",
        catatan: assessment.notes || "",
      }));

      const csv = [
        Object.keys(csvContent[0]).join(","),
        ...csvContent.map((row) => Object.values(row).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nutrimood-history-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting data:", err);
      error("Gagal mengexport data");
    }
  };

  useEffect(() => {
    if (user) {
      loadHistoryData();
    }
  }, [user, loadHistoryData]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-forest-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-forest-900 mb-2">
            Login Diperlukan
          </h2>
          <p className="text-sage-600 mb-6">
            Silakan login untuk melihat riwayat analisis Anda
          </p>
          <Link
            href="/auth/login"
            className="bg-forest-600 text-white px-6 py-3 rounded-lg hover:bg-forest-700 transition-colors"
          >
            Login Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <History className="w-8 h-8 text-forest-600" />
            <h1 className="text-4xl font-bold text-forest-900">
              Riwayat Analisis
            </h1>
          </div>
          <p className="text-sage-600 text-lg">
            Pantau perkembangan kesehatan nutrisi dan mood Anda dari waktu ke
            waktu
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8 text-forest-600" />
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.totalAssessments}
            </div>
            <div className="text-sage-600 text-sm">Total Analisis</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {(stats.averageConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-sage-600 text-sm">Rata-rata Akurasi</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-600" />
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.streakDays}
            </div>
            <div className="text-sage-600 text-sm">Hari Berturut</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <span className="text-2xl">⏰</span>
            </div>
            <div className="text-2xl font-bold text-forest-900">
              {stats.favoriteTime || "-"}
            </div>
            <div className="text-sage-600 text-sm">Waktu Favorit</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-sage-200">
            <div className="flex">
              {[
                {
                  key: "assessments",
                  label: "Riwayat Analisis",
                  icon: History,
                },
                { key: "analytics", label: "Analytics", icon: BarChart3 },
                { key: "foods", label: "Makanan Favorit", icon: Heart },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === key
                      ? "bg-forest-600 text-white shadow-md"
                      : "text-sage-700 hover:bg-sage-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-forest-900 mb-2">
                Periode Waktu
              </label>
              <select
                value={timeFilter}
                onChange={(e) =>
                  setTimeFilter(e.target.value as TimeFilterType)
                }
                className="w-full border border-sage-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              >
                <option value="all">Semua Waktu</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">1 Bulan Terakhir</option>
                <option value="year">1 Tahun Terakhir</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-forest-900 mb-2">
                Filter Mood
              </label>
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="w-full border border-sage-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              >
                <option value="all">Semua Mood</option>
                <option value="energizing">Energizing ⚡</option>
                <option value="calming">Calming 😌</option>
                <option value="focusing">Focusing 🎯</option>
                <option value="relaxing">Relaxing 😴</option>
                <option value="balanced">Balanced ⚖️</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={exportData}
                disabled={assessments.length === 0}
                className="flex items-center gap-2 bg-forest-600 text-white px-6 py-2 rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4"></div>
            <p className="text-sage-600">Memuat data riwayat...</p>
          </div>
        ) : (
          <>
            {activeTab === "assessments" && (
              <div className="space-y-6">
                {assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-sage-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-sage-600 mb-2">
                      Belum Ada Riwayat
                    </h3>
                    <p className="text-sage-500 mb-6">
                      Mulai analisis nutrisi pertama Anda untuk melihat riwayat
                      di sini
                    </p>
                    <Link
                      href="/recommendations/assessment"
                      className="bg-forest-600 text-white px-6 py-3 rounded-lg hover:bg-forest-700 transition-colors"
                    >
                      Mulai Analisis
                    </Link>
                  </div>
                ) : (
                  assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="bg-white rounded-2xl shadow-sm border border-sage-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center">
                              <span className="text-2xl">
                                {getMoodEmoji(assessment.predicted_mood)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-forest-900 capitalize">
                                {assessment.predicted_mood}
                              </h3>
                              <p className="text-sm text-sage-600">
                                {new Date(
                                  assessment.created_at
                                ).toLocaleDateString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm text-sage-600">
                                Akurasi
                              </div>
                              <div className="font-semibold text-forest-900">
                                {(assessment.confidence_score * 100).toFixed(1)}
                                %
                              </div>
                            </div>
                            <button
                              onClick={() => toggleExpanded(assessment.id)}
                              className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
                            >
                              {expandedItems.has(assessment.id) ? (
                                <ChevronUp className="w-5 h-5 text-sage-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-sage-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-red-50 rounded-lg p-3">
                            <div className="text-sm text-red-600 mb-1">
                              Kalori
                            </div>
                            <div className="font-semibold text-red-800">
                              {getLevelLabelIndonesia(assessment.calorie_level)}
                            </div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-sm text-blue-600 mb-1">
                              Protein
                            </div>
                            <div className="font-semibold text-blue-800">
                              {getLevelLabelIndonesia(assessment.protein_level)}
                            </div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-3">
                            <div className="text-sm text-yellow-600 mb-1">
                              Lemak
                            </div>
                            <div className="font-semibold text-yellow-800">
                              {getLevelLabelIndonesia(assessment.fat_level)}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-sm text-green-600 mb-1">
                              Karbohidrat
                            </div>
                            <div className="font-semibold text-green-800">
                              {getLevelLabelIndonesia(assessment.carb_level)}
                            </div>
                          </div>
                        </div>

                        {assessment.notes && (
                          <div className="bg-sage-50 rounded-lg p-3 mb-4">
                            <div className="text-sm text-sage-600 mb-1">
                              Catatan
                            </div>
                            <div className="text-sage-800">
                              {assessment.notes}
                            </div>
                          </div>
                        )}

                        {expandedItems.has(assessment.id) &&
                          assessment.food_recommendations && (
                            <div className="border-t border-sage-200 pt-4">
                              <h4 className="font-semibold text-forest-900 mb-3">
                                Rekomendasi Makanan
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {assessment.food_recommendations.map((food) => (
                                  <div
                                    key={food.id}
                                    className="bg-sage-50 rounded-lg p-4"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium text-forest-900">
                                        {food.food_name}
                                      </h5>
                                      <div className="flex items-center gap-1">
                                        {food.is_liked && (
                                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                                        )}
                                        {food.is_consumed && (
                                          <span className="text-green-600">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-sage-600">
                                      <div>Kalori: {food.calories}</div>
                                      <div>Protein: {food.proteins}g</div>
                                      <div>Lemak: {food.fats}g</div>
                                      <div>Karbo: {food.carbohydrates}g</div>
                                    </div>
                                    <div className="mt-2 text-sm text-sage-500">
                                      Kecocokan:{" "}
                                      {(food.similarity_score * 100).toFixed(1)}
                                      %
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
                <h3 className="text-xl font-semibold text-forest-900 mb-6">
                  Distribusi Mood
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats.moodDistribution)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([mood, count]) => (
                      <div key={mood} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium text-forest-900 capitalize flex items-center gap-2">
                          <span>{getMoodEmoji(mood)}</span>
                          {mood}
                        </div>
                        <div className="flex-1 bg-sage-200 rounded-full h-3">
                          <div
                            className="bg-forest-600 h-3 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                ((count as number) / stats.totalAssessments) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="w-12 text-sm text-sage-600 text-right">
                          {count as number}x
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "foods" && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
                <div className="text-center py-12">
                  <Utensils className="w-16 h-16 text-sage-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-sage-600 mb-2">
                    Makanan Favorit
                  </h3>
                  <p className="text-sage-500">Fitur ini akan segera hadir!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
