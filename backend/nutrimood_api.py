from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import tensorflow as tf
import joblib
import pickle
import pandas as pd
from typing import List
from fastapi.middleware.cors import CORSMiddleware

# ===== DEFINISI CLASS FOODRECOMMENDER =====
class FoodRecommender:
    def __init__(self, food_df=None):
        self.food_df = food_df
    
    def recommend_for_mood(self, mood: str, top_n: int = 5) -> pd.DataFrame:
        """Memberikan rekomendasi makanan berdasarkan mood"""
        if self.food_df is None:
            raise ValueError("Data makanan belum dimuat!")
        
        valid_moods = ["energizing", "relaxing", "focusing", "uncategorized"]
        if mood.lower() not in valid_moods:
            raise ValueError(f"Mood harus salah satu dari: {valid_moods}")
            
        # Filter makanan berdasarkan mood
        filtered = self.food_df[self.food_df['primary_mood'] == mood.lower()]
        
        # Jika tidak ada makanan untuk mood tersebut
        if filtered.empty:
            raise ValueError(f"Tidak ditemukan makanan untuk mood: {mood}")
            
        return filtered.head(top_n)

# ===== LOAD MODEL =====
app = FastAPI()

# Tambahkan CORS agar bisa diakses dari browser/file lokal
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan domain frontend jika ingin lebih aman
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
encoder = None
recommender = None

try:
    # Load mood classifier
    model = tf.keras.models.load_model('mood_classifier_model.keras')
    scaler = joblib.load('mood_feature_scaler.pkl')
    encoder = joblib.load('mood_encoder.pkl')
    
    # Load food recommender
    print("Memuat data makanan dari food_recommender.pkl...")
    try:
        with open('food_recommender.pkl', 'rb') as f:
            food_data = pickle.load(f)
            if not isinstance(food_data, pd.DataFrame):
                print("File food_recommender.pkl harus berisi DataFrame")
                food_data = None
            else:
                # Validasi kolom yang diperlukan
                required_columns = ['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood']
                missing_columns = [col for col in required_columns if col not in food_data.columns]
                if missing_columns:
                    print(f"Data makanan tidak memiliki kolom yang diperlukan: {missing_columns}")
                    food_data = None
                else:
                    print(f"Data makanan berhasil dimuat")
                    print(f"Kolom yang tersedia: {food_data.columns.tolist()}")
                    print(f"Jumlah data: {len(food_data)}")
                    print(f"Contoh data:\n{food_data.head()}")
    except FileNotFoundError:
        print("File food_recommender.pkl tidak ditemukan di direktori backend")
        food_data = None
    except Exception as e:
        print(f"Gagal memuat data makanan: {str(e)}")
        food_data = None
    if food_data is not None:
        recommender = FoodRecommender(food_data)
    print("✅ Semua model berhasil dimuat")
except Exception as e:
    print(f"❌ Gagal memuat model: {e}")
    model = None
    scaler = None
    encoder = None
    recommender = None

# ===== SCHEMAS =====
class HealthInput(BaseModel):
    calorie_category: int  # 0=very_low, 1=low, 2=medium, 3=high
    protein_category: int
    fat_category: int
    carb_category: int

class MoodPrediction(BaseModel):
    mood: str
    confidence: float

class FoodRecommendation(BaseModel):
    name: str
    calories: float
    proteins: float
    fat: float
    carbohydrate: float
    primary_mood: str

# ===== ENDPOINTS =====
@app.post("/predict", response_model=MoodPrediction)
async def predict_mood(input_data: HealthInput):
    try:
        if model is None or scaler is None or encoder is None:
            raise HTTPException(500, detail="Model belum siap. Silakan hubungi admin.")
        # Mapping mood dari angka ke string
        mood_mapping = {
            0: "energizing",
            1: "relaxing",
            2: "focusing",
            3: "uncategorized"
        }
        
        # Buat input array dan pastikan bentuknya benar
        input_array = np.array([
            input_data.calorie_category,
            input_data.protein_category,
            input_data.fat_category,
            input_data.carb_category
        ], dtype=np.float32)
        
        # Reshape ke (1,4) dan pastikan bentuknya benar
        input_array = input_array.reshape(1, 4)
        print(f"Input array shape: {input_array.shape}")
        
        # Transform dengan scaler
        scaled_input = scaler.transform(input_array)
        print(f"Scaled input shape: {scaled_input.shape}")
        
        # Prediksi
        preds = model.predict(scaled_input, verbose=0)
        print(f"Predictions shape: {preds.shape}")
        
        # Dapatkan prediksi kelas
        pred_class = np.argmax(preds, axis=1)
        print(f"Predicted class: {pred_class}")
        
        # Buat one-hot encoding dari prediksi kelas
        one_hot_pred = np.zeros((1, 4))  # 4 adalah jumlah kelas yang mungkin
        one_hot_pred[0, pred_class[0]] = 1
        print(f"One-hot prediction shape: {one_hot_pred.shape}")
        
        # Decode prediksi
        mood_idx = encoder.inverse_transform(one_hot_pred)[0][0]
        mood = mood_mapping[mood_idx]  # Konversi ke string menggunakan mapping
        confidence = float(np.max(preds))
        
        print(f"Final mood: {mood}, confidence: {confidence}")
        
        return MoodPrediction(mood=mood, confidence=confidence)
        
    except Exception as e:
        print(f"Error details: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, detail=f"Prediction error: {str(e)}")

@app.get("/recommend", response_model=List[FoodRecommendation])
async def get_recommendations(mood: str, top_n: int = 5):
    try:
        if recommender is None:
            raise HTTPException(500, detail="Rekomendasi makanan belum siap. Silakan hubungi admin.")
        print(f"Requesting recommendations for mood: {mood}, top_n: {top_n}")
        
        # Pastikan mood dalam lowercase
        mood = mood.lower()
        
        # Validasi mood
        valid_moods = ["energizing", "relaxing", "focusing", "uncategorized"]
        if mood not in valid_moods:
            raise HTTPException(400, detail=f"Mood harus salah satu dari: {valid_moods}")
        
        # Dapatkan rekomendasi
        recs = recommender.recommend_for_mood(mood, top_n)
        print(f"Found {len(recs)} recommendations")
        
        if recs.empty:
            raise HTTPException(404, detail=f"Tidak ditemukan rekomendasi untuk mood: {mood}")
        
        # Konversi ke format response
        recommendations = []
        for _, row in recs.iterrows():
            try:
                recommendation = FoodRecommendation(
                    name=str(row['name']),
                    calories=float(row['calories']),
                    proteins=float(row['proteins']),
                    fat=float(row['fat']),
                    carbohydrate=float(row['carbohydrate']),
                    primary_mood=str(row['primary_mood'])
                )
                recommendations.append(recommendation)
            except Exception as e:
                print(f"Error converting row to recommendation: {str(e)}")
                print(f"Row data: {row.to_dict()}")
                continue
        
        if not recommendations:
            raise HTTPException(500, detail="Gagal mengkonversi rekomendasi ke format yang diharapkan")
            
        return recommendations
        
    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(400, detail=f"Recommendation error: {str(e)}")

@app.get("/")
def root():
    return {"status": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)