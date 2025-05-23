#!/usr/bin/env python3
"""
ML Inference Script untuk NutriMood
Menggunakan model yang sudah dilatih untuk prediksi mood dan rekomendasi makanan
"""

import sys
import os
import json
import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import pickle
from pathlib import Path

class NutriMoodInference:
    """
    Kelas untuk melakukan inferensi menggunakan model NutriMood yang sudah dilatih
    """
    
    def __init__(self, model_dir='models'):
        """
        Inisialisasi dengan path ke direktori model
        """
        self.model_dir = Path(model_dir)
        self.mood_model = None
        self.feature_scaler = None
        self.mood_encoder = None
        self.food_recommender = None
        
        # Load semua model yang diperlukan
        self._load_models()
    
    def _load_models(self):
        """
        Load semua model dan transformer
        """
        try:
            # Load mood classifier model
            mood_model_path = self.model_dir / 'mood_classifier_model.keras'
            if mood_model_path.exists():
                self.mood_model = tf.keras.models.load_model(str(mood_model_path))
                print(f"✓ Mood classifier loaded from {mood_model_path}")
            else:
                print(f"✗ Mood classifier not found at {mood_model_path}")
                
            # Load feature scaler
            scaler_path = self.model_dir / 'mood_feature_scaler.pkl'
            if scaler_path.exists():
                self.feature_scaler = joblib.load(str(scaler_path))
                print(f"✓ Feature scaler loaded from {scaler_path}")
            else:
                print(f"✗ Feature scaler not found at {scaler_path}")
                
            # Load mood encoder
            encoder_path = self.model_dir / 'mood_encoder.pkl'
            if encoder_path.exists():
                self.mood_encoder = joblib.load(str(encoder_path))
                print(f"✓ Mood encoder loaded from {encoder_path}")
            else:
                print(f"✗ Mood encoder not found at {encoder_path}")
                
            # Load food recommender
            recommender_path = self.model_dir / 'food_recommender.pkl'
            if recommender_path.exists():
                with open(str(recommender_path), 'rb') as f:
                    self.food_recommender = pickle.load(f)
                print(f"✓ Food recommender loaded from {recommender_path}")
            else:
                print(f"✗ Food recommender not found at {recommender_path}")
                
        except Exception as e:
            print(f"Error loading models: {e}")
            sys.exit(1)
    
    def predict_mood(self, calorie_level, protein_level, fat_level, carb_level):
        """
        Prediksi mood berdasarkan level nutrisi
        
        Args:
            calorie_level (int): Level kalori (0-3)
            protein_level (int): Level protein (0-3)
            fat_level (int): Level lemak (0-3)
            carb_level (int): Level karbohidrat (0-3)
            
        Returns:
            tuple: (predicted_mood, confidence_score)
        """
        if not all([self.mood_model, self.feature_scaler, self.mood_encoder]):
            raise ValueError("Model components not properly loaded")
        
        # Prepare input features
        features = np.array([[calorie_level, protein_level, fat_level, carb_level]])
        
        # Scale features
        features_scaled = self.feature_scaler.transform(features)
        
        # Predict mood probabilities
        mood_probs = self.mood_model.predict(features_scaled, verbose=0)
        
        # Get predicted class
        predicted_class = np.argmax(mood_probs, axis=1)[0]
        confidence = float(mood_probs[0][predicted_class])
        
        # Decode to mood label
        # Berdasarkan training code, urutan mood adalah:
        # ['energizing', 'focusing', 'multi_category', 'relaxing', 'uncategorized']
        mood_classes = ['energizing', 'focusing', 'multi_category', 'relaxing', 'uncategorized']
        predicted_mood = mood_classes[predicted_class] if predicted_class < len(mood_classes) else 'uncategorized'
        
        return predicted_mood, confidence
    
    def get_food_recommendations(self, mood, top_n=5):
        """
        Dapatkan rekomendasi makanan berdasarkan mood
        
        Args:
            mood (str): Mood yang diprediksi
            top_n (int): Jumlah rekomendasi
            
        Returns:
            list: List rekomendasi makanan
        """
        if not self.food_recommender:
            raise ValueError("Food recommender not loaded")
        
        try:
            # Gunakan food recommender untuk mendapatkan rekomendasi
            recommendations = self.food_recommender.recommend_for_mood(mood, top_n)
            
            # Convert DataFrame to list of dictionaries
            food_list = []
            for _, row in recommendations.iterrows():
                food_item = {
                    'food_name': str(row.get('name', '')),
                    'calories': float(row.get('calories', 0)),
                    'proteins': float(row.get('proteins', 0)),
                    'fats': float(row.get('fat', 0)),
                    'carbohydrates': float(row.get('carbohydrate', 0)),
                    'similarity_score': float(row.get('similarity_score', 0)),
                    'mood_category': mood
                }
                food_list.append(food_item)
            
            return food_list
            
        except Exception as e:
            print(f"Error getting food recommendations: {e}", file=sys.stderr)
            # Fallback: return empty list
            return []
    
    def predict(self, calorie_level, protein_level, fat_level, carb_level):
        """
        Prediksi lengkap: mood + rekomendasi makanan
        
        Args:
            calorie_level (int): Level kalori (0-3)
            protein_level (int): Level protein (0-3)
            fat_level (int): Level lemak (0-3)
            carb_level (int): Level karbohidrat (0-3)
            
        Returns:
            dict: Hasil prediksi lengkap
        """
        # Validate input
        for level in [calorie_level, protein_level, fat_level, carb_level]:
            if not isinstance(level, int) or level < 0 or level > 3:
                raise ValueError("All nutrition levels must be integers between 0 and 3")
        
        # Predict mood
        predicted_mood, confidence = self.predict_mood(
            calorie_level, protein_level, fat_level, carb_level
        )
        
        # Get food recommendations
        food_recommendations = self.get_food_recommendations(predicted_mood)
        
        # Prepare result
        result = {
            'mood_prediction': {
                'mood': predicted_mood,
                'confidence': confidence
            },
            'food_recommendations': food_recommendations,
            'input': {
                'calorie_level': calorie_level,
                'protein_level': protein_level,
                'fat_level': fat_level,
                'carb_level': carb_level
            }
        }
        
        return result

def main():
    """
    Main function untuk command line usage
    """
    parser = argparse.ArgumentParser(description='NutriMood ML Inference')
    parser.add_argument('--calorie', type=int, required=True, 
                       help='Calorie level (0-3)')
    parser.add_argument('--protein', type=int, required=True,
                       help='Protein level (0-3)')
    parser.add_argument('--fat', type=int, required=True,
                       help='Fat level (0-3)')
    parser.add_argument('--carb', type=int, required=True,
                       help='Carbohydrate level (0-3)')
    parser.add_argument('--model-dir', default='models',
                       help='Directory containing model files')
    
    args = parser.parse_args()
    
    try:
        # Initialize inference
        inference = NutriMoodInference(model_dir=args.model_dir)
        
        # Make prediction
        result = inference.predict(
            calorie_level=args.calorie,
            protein_level=args.protein,
            fat_level=args.fat,
            carb_level=args.carb
        )
        
        # Output JSON result
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'input': {
                'calorie_level': args.calorie,
                'protein_level': args.protein,
                'fat_level': args.fat,
                'carb_level': args.carb
            }
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()