"use client";

import { useState, useEffect } from "react";
import { Brain, Utensils, Zap, Heart, Target, Loader2 } from "lucide-react";
import { nutriMoodPredictor } from "@/utils/nutrimood";

interface NutritionLevels {
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
}

interface AnalysisResult {
  mood_analysis: {
    predicted_mood: string;
    confidence: number;
    confidence_percentage: string;
    all_probabilities: Record<string, number>;
    rule_based_mood: string;
    nutrient_categories: {
      calories: string;
      proteins: string;
      fat: string;
      carbohydrate: string;
    };
    input_values: NutritionLevels;
  };
  food_recommendations: Array<{
    food_name: string;
    calories: number;
    proteins: number;
    fat: number;
    carbohydrate: number;
    primary_mood: string;
  }>;
  nutritional_advice: string[];
  mood_description: string;
  is_balanced: boolean;
}

export default function NutritionDemo() {
  const [nutritionLevels, setNutritionLevels] = useState<NutritionLevels>({
    calories: 0,
    proteins: 0,
    fat: 0,
    carbohydrate: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    setModelLoading(true);
    nutriMoodPredictor
      .loadModel("/tfjs_model")
      .then(() => {
        setModelReady(true);
        setModelLoading(false);
      })
      .catch((err) => {
        setError("Gagal memuat model: " + (err?.message || err));
        setModelLoading(false);
      });
  }, []);

  const levelLabels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi"];
  const levelColors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-yellow-100 text-yellow-700 border-yellow-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-blue-100 text-blue-700 border-blue-200",
  ];

  const getNutrientValue = (level: number, nutrient: keyof NutritionLevels) => {
    switch (nutrient) {
      case "calories":
        return level === 0 ? 50 : level === 1 ? 150 : level === 2 ? 300 : 500;
      case "proteins":
        return level === 0 ? 2 : level === 1 ? 10 : level === 2 ? 20 : 40;
      case "fat":
        return level === 0 ? 2 : level === 1 ? 10 : level === 2 ? 20 : 40;
      case "carbohydrate":
        return level === 0 ? 10 : level === 1 ? 25 : level === 2 ? 40 : 60;
      default:
        return 0;
    }
  };

  const handleLevelChange = (
    nutrient: keyof NutritionLevels,
    level: number
  ) => {
    setNutritionLevels((prev) => ({
      ...prev,
      [nutrient]: getNutrientValue(level, nutrient),
    }));
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const analysis = await nutriMoodPredictor.analyzeNutrition(
        nutritionLevels.calories,
        nutritionLevels.proteins,
        nutritionLevels.fat,
        nutritionLevels.carbohydrate
      );
      setResult(analysis as AnalysisResult);
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
    nutrient: keyof NutritionLevels,
    label: string,
    icon: React.ReactNode,
    description: string
  ) => {
    const currentLevel = nutritionLevels[nutrient];
    const selectedLevel =
      currentLevel <= getNutrientValue(0, nutrient)
        ? 0
        : currentLevel <= getNutrientValue(1, nutrient)
        ? 1
        : currentLevel <= getNutrientValue(2, nutrient)
        ? 2
        : 3;

    return (
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
                  selectedLevel === level
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
  };

  return (
    <div className="max-w-4xl mx-auto">
      {modelLoading && (
        <div className="text-center text-sage-700 mb-6">
          <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
          Memuat model prediksi...
        </div>
      )}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-earth border border-sage-200">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-forest-900 mb-3">
            Analisis Nutrisi
          </h3>
          <p className="text-sage-700">
            Pilih tingkat konsumsi nutrisi Anda untuk mendapatkan prediksi mood
            dan rekomendasi makanan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {renderNutrientSelector(
            "calories",
            "Kalori",
            <Zap className="w-5 h-5" />,
            "Total energi yang dikonsumsi"
          )}

          {renderNutrientSelector(
            "proteins",
            "Protein",
            <Target className="w-5 h-5" />,
            "Pembangun dan perbaikan otot"
          )}

          {renderNutrientSelector(
            "fat",
            "Lemak",
            <Heart className="w-5 h-5" />,
            "Sumber energi dan vitamin"
          )}

          {renderNutrientSelector(
            "carbohydrate",
            "Karbohidrat",
            <Utensils className="w-5 h-5" />,
            "Sumber energi utama tubuh"
          )}
        </div>

        <button
          onClick={handlePredict}
          disabled={isLoading || !modelReady}
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
                  {result.mood_analysis.predicted_mood === "energizing"
                    ? "⚡"
                    : result.mood_analysis.predicted_mood === "relaxing"
                    ? "😌"
                    : result.mood_analysis.predicted_mood === "focusing"
                    ? "🎯"
                    : "🤔"}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-forest-900 mb-2">
                Mood Anda:{" "}
                <span className="text-orange-600 capitalize">
                  {result.mood_analysis.predicted_mood}
                </span>
              </h4>
              <p className="text-sage-700">
                Confidence: {result.mood_analysis.confidence_percentage}%
              </p>
            </div>

            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mx-auto w-fit bg-orange-100 text-orange-700">
              {result.mood_description}
            </div>
          </div>

          {/* Food Recommendations */}
          <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
            <h4 className="text-2xl font-bold text-forest-900 mb-6 text-center">
              Rekomendasi Makanan
            </h4>

            {result.food_recommendations &&
            result.food_recommendations.length > 0 ? (
              <div className="grid gap-4">
                {result.food_recommendations.map((food, index) => (
                  <div
                    key={index}
                    className="bg-sage-50 rounded-xl p-6 border border-sage-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-forest-900 text-lg mb-2">
                          {food.food_name}
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
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
                              {food.fat.toFixed(1)}g
                            </span>
                          </div>
                          <div>
                            <span className="text-sage-600">Karbo:</span>
                            <span className="font-medium text-forest-700 ml-1">
                              {food.carbohydrate.toFixed(1)}g
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm font-medium">
                          {food.primary_mood}
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

          {/* Nutritional Advice */}
          {result.nutritional_advice &&
            result.nutritional_advice.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
                <h4 className="text-2xl font-bold text-forest-900 mb-6 text-center">
                  Saran Nutrisi
                </h4>
                <ul className="space-y-3">
                  {result.nutritional_advice.map((advice, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-forest-100 rounded-full flex items-center justify-center text-forest-600 mt-0.5">
                        •
                      </div>
                      <p className="text-sage-700">{advice}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
