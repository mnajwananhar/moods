"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      error("Validasi Gagal", "Nama lengkap tidak boleh kosong.");
      return false;
    }

    if (!formData.email.trim()) {
      error("Validasi Gagal", "Email tidak boleh kosong.");
      return false;
    }

    if (formData.password.length < 6) {
      error("Validasi Gagal", "Password minimal 6 karakter.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      error("Validasi Gagal", "Konfirmasi password tidak cocok.");
      return false;
    }

    if (!acceptTerms) {
      error("Validasi Gagal", "Anda harus menyetujui syarat dan ketentuan.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error: authError } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
        }
      );

      if (authError) {
        if (authError.message.includes("User already registered")) {
          error(
            "Pendaftaran Gagal",
            "Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda."
          );
        } else if (
          authError.message.includes("Password should be at least 6 characters")
        ) {
          error("Pendaftaran Gagal", "Password minimal 6 karakter.");
        } else {
          error("Pendaftaran Gagal", authError.message);
        }
      } else {
        success(
          "Pendaftaran Berhasil!",
          "Silakan cek email Anda untuk konfirmasi akun."
        );
        router.push(
          "/auth/verify-email?email=" + encodeURIComponent(formData.email)
        );
      }
    } catch (err) {
      console.error("Sign up error:", err);
      error("Terjadi Kesalahan", "Silakan coba lagi dalam beberapa saat.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      const { error: authError } = await signInWithGoogle();

      if (authError) {
        error("Google Sign Up Gagal", authError.message);
      }
      // Success akan ditangani oleh auth state change
    } catch (err) {
      console.error("Google sign up error:", err);
      error("Terjadi Kesalahan", "Silakan coba lagi dalam beberapa saat.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6)
      return { strength: 1, label: "Lemah", color: "bg-red-500" };
    if (password.length < 8)
      return { strength: 2, label: "Sedang", color: "bg-yellow-500" };
    if (
      password.length >= 8 &&
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      return { strength: 3, label: "Kuat", color: "bg-green-500" };
    }
    return { strength: 2, label: "Sedang", color: "bg-yellow-500" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-3 group mb-6"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-forest-600 to-forest-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-forest-900 group-hover:text-forest-700 transition-colors">
              NutriMood
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-forest-900 mb-2">
            Daftar Gratis Sekarang
          </h1>
          <p className="text-sage-700">
            Bergabunglah dengan ribuan orang yang telah menemukan keseimbangan
            nutrisi dan mood.
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-8">
          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-sage-300 text-sage-700 px-6 py-3 rounded-xl font-semibold hover:bg-sage-50 hover:border-sage-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="w-5 h-5 bg-white rounded border">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
            )}
            <span>Daftar dengan Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sage-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-sage-500">
                atau daftar dengan email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-sage-700 mb-1"
              >
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-sage-400" />
                </div>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-sage-300 rounded-xl text-sage-900 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-sage-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-sage-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-sage-300 rounded-xl text-sage-900 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sage-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-sage-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-2 border border-sage-300 rounded-xl text-sage-900 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Masukkan password Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-sage-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-sage-400" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-sage-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-sage-600">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-sage-700 mb-1"
              >
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-sage-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-10 py-2 border border-sage-300 rounded-xl text-sage-900 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  placeholder="Konfirmasi password Anda"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-sage-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-sage-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-sage-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-sage-700">
                  Saya setuju dengan{" "}
                  <Link
                    href="/terms"
                    className="text-forest-600 hover:text-forest-500"
                  >
                    Syarat dan Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link
                    href="/privacy"
                    className="text-forest-600 hover:text-forest-500"
                  >
                    Kebijakan Privasi
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-2 bg-forest-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-forest-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-sage-600">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="text-forest-600 hover:text-forest-500 font-medium"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
