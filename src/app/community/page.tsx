"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Star,
  Award,
  Search,
  ChefHat,
  BookOpen,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";

interface CommunityPost {
  id: string;
  user_id: string;
  type: "recipe" | "story" | "question" | "tip" | "review";
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
  food_name?: string;
  rating?: number;
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "weekly" | "daily" | "monthly";
  category: "nutrition" | "mood" | "community";
  participant_count: number;
  reward_points: number;
  is_active: boolean;
}

type TabKey = "feed" | "challenges" | "leaderboard";
type FilterKey = "all" | "recipe" | "story" | "question" | "tip" | "review";

export default function CommunityPage() {
  const { user } = useAuth();
  const { error } = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("feed");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCommunityData();
    if (user) {
      loadUserLikes();
    }
  }, [user]);

  const loadCommunityData = async () => {
    try {
      // Load posts
      let postsQuery = supabase
        .from("community_posts")
        .select(
          `
          *,
          profiles(full_name, avatar_url)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (selectedFilter !== "all") {
        postsQuery = postsQuery.eq("type", selectedFilter);
      }

      if (searchQuery) {
        postsQuery = postsQuery.or(
          `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`
        );
      }

      const { data: postsData } = await postsQuery;

      // Load challenges
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
      setChallenges(challengesData || []);
    } catch (err) {
      console.error("Error loading community data:", err);
      error(
        "Gagal Memuat Data",
        "Terjadi kesalahan saat memuat data komunitas."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUserLikes = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (data) {
        setLikedPosts(new Set(data.map((like) => like.post_id)));
      }
    } catch (err) {
      console.error("Error loading user likes:", err);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) {
      error("Login Diperlukan", "Anda harus login untuk menyukai postingan.");
      return;
    }

    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .match({ user_id: user.id, post_id: postId });

        await supabase.rpc("decrement_post_likes", { post_id: postId });
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({ user_id: user.id, post_id: postId });

        await supabase.rpc("increment_post_likes", { post_id: postId });
      }

      // Update local state
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // Update posts state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes_count: post.likes_count + (isLiked ? -1 : 1) }
            : post
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
      error("Gagal Menyukai", "Terjadi kesalahan saat menyukai postingan.");
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "recipe":
        return <ChefHat className="w-4 h-4" />;
      case "story":
        return <BookOpen className="w-4 h-4" />;
      case "question":
        return <MessageCircle className="w-4 h-4" />;
      case "tip":
        return <Target className="w-4 h-4" />;
      case "review":
        return <Star className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "recipe":
        return "bg-orange-100 text-orange-700";
      case "story":
        return "bg-blue-100 text-blue-700";
      case "question":
        return "bg-purple-100 text-purple-700";
      case "tip":
        return "bg-green-100 text-green-700";
      case "review":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getChallengeIcon = (category: string) => {
    switch (category) {
      case "nutrition":
        return <Target className="w-5 h-5" />;
      case "mood":
        return <Heart className="w-5 h-5" />;
      case "community":
        return <Users className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sage-700">Memuat komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-forest-900 mb-4">
            Komunitas NutriMood
          </h1>
          <p className="text-xl text-sage-700 max-w-3xl mx-auto">
            Bergabunglah dengan ribuan orang yang berbagi perjalanan kesehatan
            dan mood mereka.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-sage-200">
            <div className="flex">
              {[
                { key: "feed", label: "Feed Komunitas", icon: Users },
                { key: "challenges", label: "Challenges", icon: Award },
                { key: "leaderboard", label: "Leaderboard", icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabKey)}
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

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Create Post */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
                <h3 className="font-semibold text-forest-900 mb-4">
                  Bagikan Cerita Anda
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/community/recipes/create"
                    className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <ChefHat className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">
                      Share Resep
                    </span>
                  </Link>

                  <Link
                    href="/community/stories/share"
                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">
                      Share Story
                    </span>
                  </Link>

                  <Link
                    href="/community/forum/create"
                    className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-800 font-medium">
                      Tanya Jawab
                    </span>
                  </Link>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
                <h3 className="font-semibold text-forest-900 mb-4">
                  Filter Postingan
                </h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari postingan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  />
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  {[
                    { key: "all", label: "Semua Postingan" },
                    { key: "recipe", label: "Resep" },
                    { key: "story", label: "Cerita" },
                    { key: "question", label: "Pertanyaan" },
                    { key: "tip", label: "Tips" },
                    { key: "review", label: "Review" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedFilter(key as FilterKey)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedFilter === key
                          ? "bg-forest-100 text-forest-700"
                          : "text-sage-700 hover:bg-sage-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200">
                <h3 className="font-semibold text-forest-900 mb-4">
                  Tag Populer
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "sehat",
                    "energizing",
                    "diet",
                    "indonesia",
                    "mudah",
                    "cepat",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-sage-100 text-sage-700 rounded-full text-sm cursor-pointer hover:bg-sage-200 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl shadow-sm border border-sage-200 overflow-hidden"
                    >
                      {/* Post Header */}
                      <div className="p-6 border-b border-sage-100">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-full flex items-center justify-center font-semibold">
                              {post.profiles?.full_name?.[0]?.toUpperCase() ||
                                "U"}
                            </div>
                            <div>
                              <div className="font-semibold text-forest-900">
                                {post.profiles?.full_name || "Anonymous"}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-sage-600">
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(
                                    post.type
                                  )}`}
                                >
                                  {getPostTypeIcon(post.type)}
                                  {post.type.charAt(0).toUpperCase() +
                                    post.type.slice(1)}
                                </div>
                                <span>•</span>
                                <span>
                                  {new Date(post.created_at).toLocaleDateString(
                                    "id-ID"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {post.is_featured && (
                            <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                              Featured
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-forest-900 mb-3">
                          {post.title}
                        </h3>

                        <div className="text-sage-700 mb-4 leading-relaxed">
                          {post.content.substring(0, 200)}
                          {post.content.length > 200 && (
                            <span className="text-forest-600 font-medium cursor-pointer">
                              {" "}
                              ...baca lebih lanjut
                            </span>
                          )}
                        </div>

                        {/* Food Rating (for reviews) */}
                        {post.type === "review" && post.rating && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-sage-600">
                              Rating:
                            </span>
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < post.rating!
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            {post.food_name && (
                              <span className="text-sm text-sage-600">
                                untuk {post.food_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-sage-100 text-sage-700 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Actions */}
                      <div className="px-6 py-4 border-t border-sage-100 bg-sage-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center gap-2 transition-colors ${
                                likedPosts.has(post.id)
                                  ? "text-red-600"
                                  : "text-sage-600 hover:text-red-600"
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  likedPosts.has(post.id) ? "fill-current" : ""
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {post.likes_count}
                              </span>
                            </button>

                            <Link
                              href={`/community/posts/${post.id}`}
                              className="flex items-center gap-2 text-sage-600 hover:text-forest-600 transition-colors"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {post.comments_count}
                              </span>
                            </Link>
                          </div>

                          <button className="text-sage-600 hover:text-forest-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-sage-400 mb-4" />
                    <h3 className="text-xl font-semibold text-sage-600 mb-2">
                      Belum Ada Postingan
                    </h3>
                    <p className="text-sage-500 mb-6">
                      Jadilah yang pertama berbagi cerita di komunitas!
                    </p>
                    <Link
                      href="/community/stories/share"
                      className="bg-forest-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-forest-700 transition-colors"
                    >
                      Bagikan Cerita Pertama
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-forest-900 mb-4">
                Weekly Challenges
              </h2>
              <p className="text-sage-700">
                Ikuti challenge mingguan untuk mendapatkan poin dan badge
                eksklusif!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center">
                        {getChallengeIcon(challenge.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-forest-900">
                          {challenge.title}
                        </h3>
                        <div className="text-sm text-sage-600 capitalize">
                          {challenge.type} • {challenge.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-sage-600">Reward</div>
                      <div className="font-bold text-orange-600">
                        {challenge.reward_points} poin
                      </div>
                    </div>
                  </div>

                  <p className="text-sage-700 mb-4">{challenge.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-sage-600">
                      {challenge.participant_count} peserta
                    </div>
                    <button className="bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors">
                      Ikuti Challenge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-forest-900 mb-4">
                Community Leaderboard
              </h2>
              <p className="text-sage-700">
                Pengguna paling aktif dan kontributif di komunitas NutriMood
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-sage-200 overflow-hidden">
              <div className="p-6 border-b border-sage-200">
                <h3 className="text-xl font-semibold text-forest-900">
                  Top Contributors
                </h3>
              </div>

              <div className="p-6">
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-sage-400 mb-4" />
                  <h3 className="text-xl font-semibold text-sage-600 mb-2">
                    Leaderboard Segera Hadir
                  </h3>
                  <p className="text-sage-500">
                    Kami sedang mempersiapkan sistem leaderboard yang menarik
                    untuk komunitas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
