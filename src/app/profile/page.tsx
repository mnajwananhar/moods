"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { Camera, Save, Loader2, User } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  age: number;
  gender: string;
  location: string;
}

interface HealthProfile {
  health_conditions: string[];
  allergies: string[];
  dietary_preferences: string[];
  health_goals: string[];
  medications: string[];
  activity_level: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(
    null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fetch basic profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch health profile
      const { data: healthData, error: healthError } = await supabase
        .from("health_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (healthError && healthError.code !== "PGRST116") throw healthError;
      setHealthProfile(
        healthData || {
          health_conditions: [],
          allergies: [],
          dietary_preferences: [],
          health_goals: [],
          medications: [],
          activity_level: "moderate",
        }
      );
    } catch (err) {
      console.error("Error fetching profile:", err);
      error(
        "Gagal memuat profil",
        "Terjadi kesalahan saat memuat data profil Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleHealthProfileChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!healthProfile) return;
    setHealthProfile({
      ...healthProfile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user || !profile || !healthProfile) return;

    try {
      setSaving(true);

      // Upload avatar if changed
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...profile,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update health profile
      const { error: healthError } = await supabase
        .from("health_profiles")
        .upsert({
          user_id: user.id,
          ...healthProfile,
          updated_at: new Date().toISOString(),
        });

      if (healthError) throw healthError;

      success(
        "Profil berhasil disimpan",
        "Perubahan pada profil Anda telah berhasil disimpan."
      );
      fetchProfile();
    } catch (err) {
      console.error("Error saving profile:", err);
      error(
        "Gagal menyimpan profil",
        "Terjadi kesalahan saat menyimpan perubahan profil Anda."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sage-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-sage-200 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-4 bg-sage-200 rounded w-3/4"></div>
              <div className="h-4 bg-sage-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !healthProfile) {
    return (
      <div className="min-h-screen bg-sage-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-sage-900">
              Profil tidak ditemukan
            </h2>
            <p className="mt-2 text-sage-600">
              Silakan coba muat ulang halaman atau hubungi dukungan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-sage-200 overflow-hidden">
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-r from-forest-600 to-forest-700">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-sage-100">
                  {avatarPreview || profile.avatar_url ? (
                    <img
                      src={avatarPreview || profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sage-400">
                      <User className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-sm border border-sage-200 cursor-pointer hover:bg-sage-50 transition-colors"
                >
                  <Camera className="w-5 h-5 text-sage-600" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="pt-20 pb-8 px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-900">
                  Informasi Dasar
                </h3>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profile.username || ""}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profile.full_name || ""}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={profile.bio || ""}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Usia
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={profile.age || ""}
                    onChange={handleProfileChange}
                    min="1"
                    max="150"
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Jenis Kelamin
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={profile.gender || ""}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Lokasi
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={profile.location || ""}
                    onChange={handleProfileChange}
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>
              </div>

              {/* Health Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-900">
                  Informasi Kesehatan
                </h3>

                <div>
                  <label
                    htmlFor="health_conditions"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Kondisi Kesehatan
                  </label>
                  <textarea
                    id="health_conditions"
                    name="health_conditions"
                    rows={3}
                    value={healthProfile.health_conditions.join(", ") || ""}
                    onChange={(e) =>
                      setHealthProfile({
                        ...healthProfile,
                        health_conditions: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      })
                    }
                    placeholder="Pisahkan dengan koma"
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="allergies"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Alergi
                  </label>
                  <textarea
                    id="allergies"
                    name="allergies"
                    rows={3}
                    value={healthProfile.allergies.join(", ") || ""}
                    onChange={(e) =>
                      setHealthProfile({
                        ...healthProfile,
                        allergies: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      })
                    }
                    placeholder="Pisahkan dengan koma"
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dietary_preferences"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Preferensi Diet
                  </label>
                  <textarea
                    id="dietary_preferences"
                    name="dietary_preferences"
                    rows={3}
                    value={healthProfile.dietary_preferences.join(", ") || ""}
                    onChange={(e) =>
                      setHealthProfile({
                        ...healthProfile,
                        dietary_preferences: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      })
                    }
                    placeholder="Pisahkan dengan koma"
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="health_goals"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Tujuan Kesehatan
                  </label>
                  <textarea
                    id="health_goals"
                    name="health_goals"
                    rows={3}
                    value={healthProfile.health_goals.join(", ") || ""}
                    onChange={(e) =>
                      setHealthProfile({
                        ...healthProfile,
                        health_goals: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      })
                    }
                    placeholder="Pisahkan dengan koma"
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="medications"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Obat-obatan
                  </label>
                  <textarea
                    id="medications"
                    name="medications"
                    rows={3}
                    value={healthProfile.medications.join(", ") || ""}
                    onChange={(e) =>
                      setHealthProfile({
                        ...healthProfile,
                        medications: e.target.value
                          .split(",")
                          .map((s) => s.trim()),
                      })
                    }
                    placeholder="Pisahkan dengan koma"
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="activity_level"
                    className="block text-sm font-medium text-sage-700"
                  >
                    Tingkat Aktivitas
                  </label>
                  <select
                    id="activity_level"
                    name="activity_level"
                    value={healthProfile.activity_level || "moderate"}
                    onChange={handleHealthProfileChange}
                    className="mt-1 block w-full rounded-lg border-sage-300 shadow-sm focus:border-forest-500 focus:ring-forest-500"
                  >
                    <option value="sedentary">Sangat Sedikit Bergerak</option>
                    <option value="light">Ringan</option>
                    <option value="moderate">Sedang</option>
                    <option value="active">Aktif</option>
                    <option value="very_active">Sangat Aktif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-forest-600 hover:bg-forest-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
