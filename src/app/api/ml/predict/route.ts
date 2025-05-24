import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NutritionInput, MLResponse } from "@/lib/ml-service";
import { spawn } from "child_process";
import path from "path";

// Fungsi untuk memanggil model ML
async function callMLModel(input: NutritionInput): Promise<MLResponse> {
  try {
    const scriptPath = path.join(
      process.cwd(),
      "src",
      "scripts",
      "ml_inference.py"
    );

    // Panggil script Python untuk inferensi
    const pythonProcess = spawn("python", [
      scriptPath,
      "--calorie_level",
      input.calorie_level.toString(),
      "--protein_level",
      input.protein_level.toString(),
      "--fat_level",
      input.fat_level.toString(),
      "--carb_level",
      input.carb_level.toString(),
    ]);

    return new Promise((resolve, reject) => {
      let result = "";
      let error = "";

      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        error += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python process error:", error);
          reject(new Error("Failed to get ML prediction"));
          return;
        }

        try {
          const prediction = JSON.parse(result);
          resolve(prediction);
        } catch (e) {
          console.error("Failed to parse ML result:", e);
          reject(new Error("Invalid ML prediction result"));
        }
      });
    });
  } catch (error) {
    console.error("ML model error:", error);
    throw new Error("Failed to call ML model");
  }
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
