import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Utensils,
  Heart,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";
import NutritionDemo from "@/components/NutritionDemo";
import FeatureCard from "@/components/FeatureCard";
import TestimonialCard from "@/components/TestimonialCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50">
      {/* Hero Section */}
      <section className="relative px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-forest-600/5 to-orange-600/5" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Nutrition & Mood Analysis
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-forest-900 leading-tight">
              Temukan Makanan
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-sage-600">
                Sesuai Mood Anda
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-sage-700 leading-relaxed">
              Dapatkan rekomendasi makanan Indonesia terbaik berdasarkan
              analisis AI dari tingkat nutrisi dan mood Anda.
              <span className="font-semibold">100% Gratis</span> selamanya!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/recommendations/assessment"
                className="group bg-gradient-to-r from-forest-600 to-forest-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center"
              >
                Mulai Analisis Nutrisi
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/learn"
                className="group border-2 border-sage-300 text-sage-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-sage-50 transition-all duration-300 flex items-center"
              >
                Pelajari Lebih Lanjut
                <Brain className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-forest-700">1,346</div>
                <div className="text-sage-600">Makanan Indonesia</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">4</div>
                <div className="text-sage-600">Kategori Mood</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-beige-600">AI</div>
                <div className="text-sage-600">Model Prediksi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Bagaimana Cara Kerjanya?
            </h2>
            <p className="text-xl text-sage-700 max-w-3xl mx-auto">
              NutriMood menggunakan teknologi AI untuk menganalisis pola nutrisi
              Anda dan memprediksi mood, kemudian memberikan rekomendasi makanan
              Indonesia yang tepat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-forest-900 mb-4">
                1. Input Nutrisi Anda
              </h3>
              <p className="text-sage-700 leading-relaxed">
                Masukkan level kalori, protein, lemak, dan karbohidrat yang Anda
                konsumsi hari ini dengan skala sederhana.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-forest-900 mb-4">
                2. AI Prediksi Mood
              </h3>
              <p className="text-sage-700 leading-relaxed">
                Model AI kami menganalisis pola nutrisi Anda untuk memprediksi
                mood (energizing, calming, focusing, dll).
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-sage-500 to-sage-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-forest-900 mb-4">
                3. Rekomendasi Personal
              </h3>
              <p className="text-sage-700 leading-relaxed">
                Dapatkan 5 makanan Indonesia terbaik yang sesuai dengan mood dan
                kebutuhan nutrisi Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-forest-50 to-sage-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Coba Sekarang Juga!
            </h2>
            <p className="text-xl text-sage-700">
              Tidak perlu daftar. Langsung coba fitur utama NutriMood di bawah
              ini.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
              </div>
            }
          >
            <NutritionDemo />
          </Suspense>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Fitur Lengkap & Gratis
            </h2>
            <p className="text-xl text-sage-700 max-w-3xl mx-auto">
              Semua fitur NutriMood tersedia gratis tanpa batas. Tidak ada
              langganan, tidak ada biaya tersembunyi.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="AI Mood Prediction"
              description="Model pembelajaran mesin canggih yang memprediksi mood Anda berdasarkan pola nutrisi dengan akurasi tinggi."
              color="forest"
            />

            <FeatureCard
              icon={<Utensils className="w-8 h-8" />}
              title="1,346 Makanan Indonesia"
              description="Database lengkap makanan tradisional Indonesia dengan informasi nutrisi detail dan resep autentik."
              color="orange"
            />

            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Analytics & Insights"
              description="Lacak pola mood dan nutrisi Anda dari waktu ke waktu dengan visualisasi yang mudah dipahami."
              color="sage"
            />

            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Komunitas Aktif"
              description="Berbagi resep, tips kesehatan, dan cerita sukses dengan ribuan pengguna lainnya."
              color="beige"
            />

            <FeatureCard
              icon={<Heart className="w-8 h-8" />}
              title="Kondisi Kesehatan"
              description="Rekomendasi disesuaikan dengan kondisi kesehatan seperti diabetes, hipertensi, atau diet khusus."
              color="forest"
            />

            <FeatureCard
              icon={<Star className="w-8 h-8" />}
              title="Review & Rating"
              description="Sistem review makanan dari komunitas untuk membantu Anda memilih yang terbaik."
              color="orange"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-20 bg-gradient-to-br from-sage-50 to-beige-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Apa Kata Pengguna?
            </h2>
            <p className="text-xl text-sage-700">
              Ribuan orang telah merasakan manfaat NutriMood untuk kesehatan dan
              mood mereka.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Sari Wijaya"
              role="Ibu Rumah Tangga"
              avatar="SW"
              content="NutriMood membantu saya memilih makanan yang tepat untuk keluarga. Sekarang anak-anak lebih berenergi dan mood saya lebih stabil setiap hari!"
              rating={5}
            />

            <TestimonialCard
              name="Dr. Ahmad Fauzi"
              role="Ahli Gizi"
              avatar="AF"
              content="Sebagai ahli gizi, saya terkesan dengan akurasi AI NutriMood. Ini tools yang sangat membantu untuk edukasi pasien tentang hubungan nutrisi dan mood."
              rating={5}
            />

            <TestimonialCard
              name="Maya Indira"
              role="Karyawan"
              avatar="MI"
              content="Dari dulu susah fokus kerja, ternyata karena pola makan salah. NutriMood kasih rekomendasi makanan yang bikin saya lebih produktif!"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-forest-600 to-forest-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Mulai Hidup Sehat Hari Ini
          </h2>
          <p className="text-xl text-forest-100 mb-10 leading-relaxed">
            Bergabunglah dengan ribuan orang yang telah menemukan keseimbangan
            nutrisi dan mood yang tepat. Daftar gratis dan mulai perjalanan
            kesehatan Anda bersama NutriMood.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="group bg-white text-forest-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              Daftar Gratis Sekarang
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/recommendations/assessment"
              className="group border-2 border-forest-200 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-forest-500 transition-all duration-300 flex items-center justify-center"
            >
              Coba Tanpa Daftar
              <Brain className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>

          <p className="text-forest-200 mt-6">
            ✓ Gratis selamanya &nbsp;&nbsp; ✓ Tanpa iklan mengganggu
            &nbsp;&nbsp; ✓ Data pribadi aman
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-900 text-forest-100 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white">NutriMood</h3>
              <p className="text-forest-200">
                Platform AI untuk rekomendasi makanan berdasarkan nutrisi dan
                mood. Gratis untuk semua orang Indonesia.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Fitur</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/recommendations"
                    className="hover:text-white transition-colors"
                  >
                    Analisis Nutrisi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/community"
                    className="hover:text-white transition-colors"
                  >
                    Komunitas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learn"
                    className="hover:text-white transition-colors"
                  >
                    Edukasi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/history"
                    className="hover:text-white transition-colors"
                  >
                    Riwayat
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Bantuan</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about/how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    Cara Kerja
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/contact"
                    className="hover:text-white transition-colors"
                  >
                    Kontak
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about/terms"
                    className="hover:text-white transition-colors"
                  >
                    Syarat & Ketentuan
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Ikuti Kami</h4>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  📘
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  📷
                </a>
                <a
                  href="#"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  🐦
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-forest-700 mt-12 pt-8 text-center">
            <p className="text-forest-300">
              © 2024 NutriMood. Dibuat dengan ❤️ untuk kesehatan masyarakat
              Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
