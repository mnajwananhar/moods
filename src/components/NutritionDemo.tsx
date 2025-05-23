"use client";

import { useState } from "react";
import { Brain, Utensils, Zap, Heart, Target, Loader2 } from "lucide-react";
import { MLService, NutritionInput, MLResponse } from "@/lib/ml-service";

type NutritionLevel = NutritionInput;

export default function NutritionDemo() {
  const [nutritionLevels, setNutritionLevels] = useState<NutritionLevel>({
    calorie_level: 2, // Medium sebagai default
    protein_level: 2,
    fat_level: 1, // Low sebagai default
    carb_level: 2,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const levelLabels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi"];
  const levelColors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-yellow-100 text-yellow-700 border-yellow-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-blue-100 text-blue-700 border-blue-200",
  ];

  const handleLevelChange = (nutrient: keyof NutritionLevel, level: number) => {
    setNutritionLevels((prev) => ({
      ...prev,
      [nutrient]: level,
    }));
    // Reset hasil ketika input berubah
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const prediction = await MLService.predictMoodAndRecommendFoods(
        nutritionLevels
      );
      setResult(prediction);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses data"
      );
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderNutrientSelector = (
    nutrient: keyof NutritionLevel,
    label: string,
    icon: React.ReactNode,
    description: string
  ) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-sage-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center text-forest-600">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-forest-900">{label}</h3>
          <p className="text-sm text-sage-600">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((level) => (
          <button
            key={level}
            onClick={() => handleLevelChange(nutrient, level)}
            className={`
              p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200
              ${
                nutritionLevels[nutrient] === level
                  ? levelColors[level] + " scale-105 shadow-md"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }
            `}
          >
            {levelLabels[level]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-earth border border-sage-200">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-forest-900 mb-3">
            Demo Analisis Nutrisi
          </h3>
          <p className="text-sage-700">
            Pilih tingkat konsumsi nutrisi Anda hari ini untuk mendapatkan
            prediksi mood dan rekomendasi makanan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {renderNutrientSelector(
            "calorie_level",
            "Kalori",
            <Zap className="w-5 h-5" />,
            "Total energi yang dikonsumsi"
          )}

          {renderNutrientSelector(
            "protein_level",
            "Protein",
            <Target className="w-5 h-5" />,
            "Pembangun dan perbaikan otot"
          )}

          {renderNutrientSelector(
            "fat_level",
            "Lemak",
            <Heart className="w-5 h-5" />,
            "Sumber energi dan vitamin"
          )}

          {renderNutrientSelector(
            "carb_level",
            "Karbohidrat",
            <Utensils className="w-5 h-5" />,
            "Sumber energi utama tubuh"
          )}
        </div>

        {/* Summary */}
        <div className="bg-sage-50 rounded-xl p-6 mb-8 border border-sage-200">
          <h4 className="font-semibold text-forest-900 mb-3">
            Ringkasan Input Anda:
          </h4>
          <p className="text-sage-700">
            {MLService.formatNutritionSummary(nutritionLevels)}
          </p>
        </div>

        {/* Predict Button */}
        <div className="text-center">
          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="group bg-gradient-to-r from-forest-600 to-forest-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center mx-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Dapatkan Rekomendasi Makanan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600">⚠️</span>
            </div>
            <div>
              <h4 className="font-semibold text-red-900">Terjadi Kesalahan</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 animate-fade-in">
          {/* Mood Prediction */}
          <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white">
                <span className="text-2xl">
                  {MLService.getMoodEmoji(result.mood_prediction.mood)}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-forest-900 mb-2">
                Mood Anda:{" "}
                <span className="text-orange-600 capitalize">
                  {result.mood_prediction.mood}
                </span>
              </h4>
              <p className="text-sage-700">
                Confidence:{" "}
                {(result.mood_prediction.confidence * 100).toFixed(1)}%
              </p>
            </div>

            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mx-auto w-fit ${MLService.getMoodColor(
                result.mood_prediction.mood
              )}`}
            >
              Berdasarkan analisis pola nutrisi Anda
            </div>
          </div>

          {/* Food Recommendations */}
          <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
            <h4 className="text-2xl font-bold text-forest-900 mb-6 text-center">
              Rekomendasi Makanan Indonesia
            </h4>

            {result.food_recommendations &&
            result.food_recommendations.length > 0 ? (
              <div className="grid gap-4">
                {result.food_recommendations.slice(0, 5).map((food, index) => (
                  <div
                    key={index}
                    className="bg-sage-50 rounded-xl p-6 border border-sage-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-forest-900 text-lg mb-2">
                          {food.food_name}
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-sage-600">Kalori:</span>
                            <span className="font-medium text-forest-700 ml-1">
                              {food.calories.toFixed(0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-sage-600">Protein:</span>
                            <span className="font-medium text-forest-700 ml-1">
                              {food.proteins.toFixed(1)}g
                            </span>
                          </div>
                          <div>
                            <span className="text-sage-600">Lemak:</span>
                            <span className="font-medium text-forest-700 ml-1">
                              {food.fats.toFixed(1)}g
                            </span>
                          </div>
                          <div>
                            <span className="text-sage-600">Karbo:</span>
                            <span className="font-medium text-forest-700 ml-1">
                              {food.carbohydrates.toFixed(1)}g
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm font-medium">
                          Match: {(food.similarity_score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sage-600 py-8">
                <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada rekomendasi makanan tersedia</p>
              </div>
            )}
          </div>

          {/* CTA to full version */}
          <div className="bg-gradient-to-r from-forest-600 to-forest-700 rounded-2xl p-8 text-center text-white">
            <h4 className="text-2xl font-bold mb-4">Suka dengan hasilnya?</h4>
            <p className="text-forest-100 mb-6">
              Daftar gratis untuk menyimpan riwayat, bergabung dengan komunitas,
              dan akses fitur lengkap lainnya!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/signup"
                className="bg-white text-forest-700 px-6 py-3 rounded-xl font-semibold hover:bg-forest-50 transition-colors"
              >
                Daftar Gratis
              </a>
              <a
                href="/recommendations/assessment"
                className="border-2 border-forest-200 text-white px-6 py-3 rounded-xl font-semibold hover:bg-forest-500 transition-colors"
              >
                Coba Fitur Lengkap
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
