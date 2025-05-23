import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NutritionInput, MLResponse } from "@/lib/ml-service";

// Fungsi untuk memanggil model ML
async function callMLModel(input: NutritionInput): Promise<MLResponse> {
  // Implementasi pemanggilan model ML Anda di sini
  // Ini adalah contoh implementasi dummy yang menggunakan input
  const { calorie_level, protein_level, fat_level, carb_level } = input;

  // Logika sederhana untuk menentukan mood berdasarkan input
  let mood = "balanced";
  const confidence = 0.85;

  // Logika sederhana berdasarkan kombinasi input
  if (calorie_level > 2 && protein_level > 1) {
    mood = "energizing";
  } else if (fat_level > 2 && carb_level > 2) {
    mood = "calming";
  } else if (protein_level > 2 && carb_level < 2) {
    mood = "focused";
  }

  return {
    mood_prediction: {
      mood,
      confidence,
    },
    food_recommendations: [
      {
        food_name: "Nasi Goreng",
        calories: 350,
        proteins: 12,
        fats: 15,
        carbohydrates: 45,
        similarity_score: 0.9,
        mood_category: mood,
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Parse request body
    const body = (await request.json()) as NutritionInput;

    // Validate input
    const { calorie_level, protein_level, fat_level, carb_level } = body;

    // Validasi bahwa semua input adalah integer 0-3
    if (
      !Number.isInteger(calorie_level) ||
      calorie_level < 0 ||
      calorie_level > 3 ||
      !Number.isInteger(protein_level) ||
      protein_level < 0 ||
      protein_level > 3 ||
      !Number.isInteger(fat_level) ||
      fat_level < 0 ||
      fat_level > 3 ||
      !Number.isInteger(carb_level) ||
      carb_level < 0 ||
      carb_level > 3
    ) {
      return NextResponse.json(
        { error: "All nutrition levels must be integers between 0 and 3" },
        { status: 400 }
      );
    }

    // Panggil model ML Anda
    const mlResult = await callMLModel({
      calorie_level,
      protein_level,
      fat_level,
      carb_level,
    });

    // Jika user sudah login, simpan assessment ke database
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Simpan nutrition assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from("nutrition_assessments")
        .insert({
          user_id: user.id,
          calorie_level,
          protein_level,
          fat_level,
          carb_level,
          predicted_mood: mlResult.mood_prediction.mood,
          confidence_score: mlResult.mood_prediction.confidence,
        })
        .select()
        .single();

      if (assessmentError) {
        console.error("Error saving assessment:", assessmentError);
      }

      // Simpan food recommendations
      if (assessment && mlResult.food_recommendations) {
        const recommendations = mlResult.food_recommendations.map((food) => ({
          assessment_id: assessment.id,
          user_id: user.id,
          food_name: food.food_name,
          calories: food.calories,
          proteins: food.proteins,
          fats: food.fats,
          carbohydrates: food.carbohydrates,
          mood_category: food.mood_category,
          similarity_score: food.similarity_score,
        }));

        const { error: recError } = await supabase
          .from("food_recommendations")
          .insert(recommendations);

        if (recError) {
          console.error("Error saving recommendations:", recError);
        }
      }
    }

    // Return hasil prediksi
    return NextResponse.json(mlResult);
  } catch (error) {
    console.error("ML API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during ML prediction" },
      { status: 500 }
    );
  }
}
