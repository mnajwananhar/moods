// ML Service untuk integrasi dengan model prediksi mood dan rekomendasi makanan
export interface NutritionInput {
  calorie_level: number; // 0-3 (Very Low, Low, Medium, High)
  protein_level: number; // 0-3
  fat_level: number; // 0-3
  carb_level: number; // 0-3
}

export interface MoodPrediction {
  mood: string;
  confidence: number;
}

export interface FoodRecommendationML {
  food_name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
  similarity_score: number;
  mood_category: string;
}

export interface MLResponse {
  mood_prediction: MoodPrediction;
  food_recommendations: FoodRecommendationML[];
}

// Service untuk memanggil model ML
export class MLService {
  private static readonly API_URL = "/api/ml/predict";

  static async predictMoodAndRecommendFoods(
    nutritionInput: NutritionInput
  ): Promise<MLResponse> {
    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nutritionInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get ML prediction");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("ML Service Error:", error);
      throw new Error("Failed to connect to ML service");
    }
  }

  // Utility function untuk mengkonversi level ke label
  static getLevelLabel(level: number): string {
    const labels = ["Very Low", "Low", "Medium", "High"];
    return labels[level] || "Unknown";
  }

  // Utility function untuk mengkonversi level ke label Indonesia
  static getLevelLabelIndonesia(level: number): string {
    const labels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi"];
    return labels[level] || "Tidak Diketahui";
  }

  // Validasi input nutrisi
  static validateNutritionInput(input: NutritionInput): boolean {
    const { calorie_level, protein_level, fat_level, carb_level } = input;

    return (
      Number.isInteger(calorie_level) &&
      calorie_level >= 0 &&
      calorie_level <= 3 &&
      Number.isInteger(protein_level) &&
      protein_level >= 0 &&
      protein_level <= 3 &&
      Number.isInteger(fat_level) &&
      fat_level >= 0 &&
      fat_level <= 3 &&
      Number.isInteger(carb_level) &&
      carb_level >= 0 &&
      carb_level <= 3
    );
  }

  // Format nutrition input untuk tampilan
  static formatNutritionSummary(input: NutritionInput): string {
    return (
      `Kalori: ${this.getLevelLabelIndonesia(input.calorie_level)}, ` +
      `Protein: ${this.getLevelLabelIndonesia(input.protein_level)}, ` +
      `Lemak: ${this.getLevelLabelIndonesia(input.fat_level)}, ` +
      `Karbohidrat: ${this.getLevelLabelIndonesia(input.carb_level)}`
    );
  }

  // Get mood emoji berdasarkan mood string
  static getMoodEmoji(mood: string): string {
    const moodEmojis: { [key: string]: string } = {
      energizing: "⚡",
      energi: "⚡",
      calming: "😌",
      tenang: "😌",
      happy: "😊",
      senang: "😊",
      focused: "🎯",
      fokus: "🎯",
      relaxed: "😴",
      rileks: "😴",
      balanced: "⚖️",
      seimbang: "⚖️",
      refreshed: "🌱",
      segar: "🌱",
    };

    return moodEmojis[mood.toLowerCase()] || "🍽️";
  }

  // Get mood color berdasarkan mood string
  static getMoodColor(mood: string): string {
    const moodColors: { [key: string]: string } = {
      energizing: "text-orange-600 bg-orange-50",
      energi: "text-orange-600 bg-orange-50",
      calming: "text-blue-600 bg-blue-50",
      tenang: "text-blue-600 bg-blue-50",
      happy: "text-yellow-600 bg-yellow-50",
      senang: "text-yellow-600 bg-yellow-50",
      focused: "text-purple-600 bg-purple-50",
      fokus: "text-purple-600 bg-purple-50",
      relaxed: "text-green-600 bg-green-50",
      rileks: "text-green-600 bg-green-50",
      balanced: "text-sage-600 bg-sage-50",
      seimbang: "text-sage-600 bg-sage-50",
      refreshed: "text-forest-600 bg-forest-50",
      segar: "text-forest-600 bg-forest-50",
    };

    return moodColors[mood.toLowerCase()] || "text-gray-600 bg-gray-50";
  }
}
