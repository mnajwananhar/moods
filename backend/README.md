# NutriMood Backend API

API backend untuk prediksi mood dan rekomendasi makanan berbasis nutrisi.

## Cara Menjalankan

1. Pastikan sudah install dependensi berikut:

   - fastapi
   - uvicorn
   - pandas
   - numpy
   - tensorflow
   - joblib
   - scikit-learn

   Install dengan:

   ```bash
   pip install fastapi uvicorn pandas numpy tensorflow joblib scikit-learn
   ```

2. Pastikan file berikut ada di folder backend:

   - mood_classifier_model.keras
   - mood_feature_scaler.pkl
   - mood_encoder.pkl
   - food_recommender.pkl

3. Jalankan server:

   ```bash
   uvicorn nutrimood_api:app --reload
   ```

4. Buka dokumentasi otomatis di browser:
   [http://localhost:8000/docs](http://localhost:8000/docs)

## Endpoint

- `POST /predict` — Prediksi mood dari input nutrisi
- `GET /recommend` — Rekomendasi makanan berdasarkan mood
