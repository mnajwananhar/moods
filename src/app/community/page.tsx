"use client";

import { useState, useEffect } from "react";
import { Heart, MessageSquare, Image as ImageIcon, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";

interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  images?: string[];
  user: {
    username: string;
    avatar_url: string;
  };
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user: {
    username: string;
    avatar_url: string;
  };
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { error, success } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    images: [] as File[],
  });
  const [uploading, setUploading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    loadCommunityData();
    if (user) {
      loadUserLikes();
    }
  }, [user]);

  const loadCommunityData = async () => {
    try {
      const postsQuery = supabase
        .from("community_posts")
        .select(
          `
          *,
          profiles(full_name, avatar_url)
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: postsData } = await postsQuery;

      setPosts(postsData || []);
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

  const handleCreatePost = async () => {
    if (!user) {
      error("Login Diperlukan", "Anda harus login untuk membuat postingan.");
      return;
    }

    if (!newPost.content.trim()) {
      error("Konten Kosong", "Konten tidak boleh kosong.");
      return;
    }

    setUploading(true);

    try {
      // Upload images first
      const imageUrls = [];
      for (const image of newPost.images) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          images: imageUrls,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Update UI
      setPosts((prev) => [post, ...prev]);
      setNewPost({ title: "", content: "", images: [] });
      setShowCreatePost(false);
      success("Berhasil", "Postingan berhasil dibuat!");
    } catch (err) {
      console.error("Error creating post:", err);
      error("Gagal Membuat Post", "Terjadi kesalahan saat membuat postingan.");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewPost((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeImage = (index: number) => {
    setNewPost((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      error("Login Diperlukan", "Anda harus login untuk berkomentar.");
      return;
    }

    if (!newComment.trim()) {
      error("Komentar Kosong", "Komentar tidak boleh kosong.");
      return;
    }

    try {
      const { data: comment, error: commentError } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          post_id: postId,
          content: newComment,
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Update UI
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setNewComment("");
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
      success("Berhasil", "Komentar berhasil ditambahkan!");
    } catch (err) {
      console.error("Error adding comment:", err);
      error(
        "Gagal Menambah Komentar",
        "Terjadi kesalahan saat menambah komentar."
      );
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
    <div className="min-h-screen bg-sage-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Tombol Buat Post */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            Buat Post
          </button>
        </div>

        {/* Modal Create Post */}
        {showCreatePost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative">
              <button
                className="absolute top-4 right-4 text-sage-500 hover:text-red-500"
                onClick={() => setShowCreatePost(false)}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold mb-4 text-forest-900">
                Buat Postingan Baru
              </h2>
              <input
                type="text"
                placeholder="Judul (opsional)"
                className="w-full mb-3 rounded-lg border-sage-300 focus:border-forest-500 focus:ring-forest-500"
                value={newPost.title}
                onChange={(e) =>
                  setNewPost({ ...newPost, title: e.target.value })
                }
              />
              <textarea
                placeholder="Apa yang ingin kamu bagikan?"
                className="w-full mb-3 rounded-lg border-sage-300 focus:border-forest-500 focus:ring-forest-500"
                rows={4}
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
              />
              {/* Upload Gambar */}
              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-sage-700 hover:text-forest-700">
                  <ImageIcon className="w-5 h-5" />
                  <span>Upload Gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {/* Preview Gambar */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {newPost.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-sage-200"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        className="object-cover w-full h-full"
                      />
                      <button
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500"
                        onClick={() => removeImage(idx)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-lg bg-sage-200 text-sage-700 hover:bg-sage-300"
                  onClick={() => setShowCreatePost(false)}
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  className="px-6 py-2 rounded-lg bg-forest-600 text-white hover:bg-forest-700 font-medium shadow-sm disabled:opacity-50"
                  onClick={handleCreatePost}
                  disabled={uploading}
                >
                  {uploading ? "Mengirim..." : "Posting"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Daftar Post */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center text-sage-500 py-16">
              Memuat postingan...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-sage-500 py-16">
              Belum ada postingan komunitas.
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-sage-200 p-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={post.user.avatar_url || "/default-avatar.png"}
                    alt={post.user.username}
                    className="w-10 h-10 rounded-full object-cover border border-sage-200"
                  />
                  <div>
                    <div className="font-semibold text-forest-900">
                      {post.user.username}
                    </div>
                    <div className="text-xs text-sage-500">
                      {new Date(post.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </div>
                {post.title && (
                  <div className="font-bold text-lg text-forest-900 mb-1">
                    {post.title}
                  </div>
                )}
                <div className="mb-2 text-sage-800 whitespace-pre-line">
                  {post.content}
                </div>
                {/* Gambar Post */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {post.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="post-img"
                        className="rounded-lg object-cover w-full h-32 border border-sage-200"
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-6 mt-2">
                  <button
                    className={`flex items-center gap-1 text-sm font-medium ${
                      likedPosts.has(post.id)
                        ? "text-red-600"
                        : "text-sage-600 hover:text-red-600"
                    }`}
                    onClick={() => handleLikePost(post.id)}
                  >
                    <Heart className="w-5 h-5" /> {post.likes_count}
                  </button>
                  <button
                    className="flex items-center gap-1 text-sm text-sage-600 hover:text-forest-700"
                    onClick={() =>
                      setSelectedPost(selectedPost === post.id ? null : post.id)
                    }
                  >
                    <MessageSquare className="w-5 h-5" /> {post.comments_count}
                  </button>
                </div>
                {/* Komentar */}
                {selectedPost === post.id && (
                  <div className="mt-4 bg-sage-50 rounded-xl p-4 border border-sage-200">
                    <div className="mb-2 font-semibold text-sage-700">
                      Komentar
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {comments[post.id]?.length ? (
                        comments[post.id].map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start gap-3"
                          >
                            <img
                              src={
                                comment.user.avatar_url || "/default-avatar.png"
                              }
                              alt={comment.user.username}
                              className="w-8 h-8 rounded-full object-cover border border-sage-200"
                            />
                            <div>
                              <div className="font-semibold text-forest-900 text-sm">
                                {comment.user.username}
                              </div>
                              <div className="text-xs text-sage-500">
                                {new Date(comment.created_at).toLocaleString(
                                  "id-ID",
                                  { dateStyle: "medium", timeStyle: "short" }
                                )}
                              </div>
                              <div className="text-sage-800 text-sm mt-1 whitespace-pre-line">
                                {comment.content}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sage-500 text-center py-4">
                          Belum ada komentar.
                        </div>
                      )}
                    </div>
                    {/* Form Komentar */}
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="text"
                        placeholder="Tulis komentar..."
                        className="flex-1 rounded-lg border-sage-300 focus:border-forest-500 focus:ring-forest-500"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button
                        className="px-4 py-2 rounded-lg bg-forest-600 text-white hover:bg-forest-700 font-medium shadow-sm"
                        onClick={() => handleAddComment(post.id)}
                      >
                        Kirim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
