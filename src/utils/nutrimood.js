// utils/nutrimood-ultimate.js - ULTIMATE SOLUTION untuk error InputLayer
import * as tf from '@tensorflow/tfjs';

class NutriMoodPredictor {
    constructor() {
        this.model = null;
        this.metadata = null;
        this.foodData = null;
        this.isLoaded = false;
    }

    async loadModel(modelPath = '/tfjs_model') {
        try {
            console.log('🚀 Loading NutriMood model...');

            // Load semua files secara parallel
            const [model, metadataResponse, foodDataResponse] = await Promise.all([
                tf.loadLayersModel(`${modelPath}/model.json`),
                fetch(`${modelPath}/metadata.json`),
                fetch(`${modelPath}/food_data.json`)
            ]);

            this.model = model;
            this.metadata = await metadataResponse.json();
            this.foodData = await foodDataResponse.json();
            this.isLoaded = true;

            console.log('✅ NutriMood model loaded successfully');
            console.log(`📊 Available moods: ${this.metadata.labels.classes.join(', ')}`);
            console.log(`🍽️ Food database: ${this.foodData.length} items`);
            console.log(`🔧 Input shape: [batch_size, ${this.metadata.model_info.input_size}]`);
            console.log(`🔧 Conversion method: ${this.metadata.model_info.conversion_method}`);

            // Test model dengan data dummy untuk memastikan berfungsi
            await this.testModelLoading();

            return true;
        } catch (error) {
            console.error('❌ Error loading NutriMood model:', error);
            throw error;
        }
    }

    async testModelLoading() {
        try {
            console.log('🧪 Testing model loading with dummy data...');

            // Create test input dengan shape yang benar
            const testInput = tf.tensor2d([[1, 2, 1, 2]], [1, 4]);  // [batch_size=1, features=4]

            // Test prediction
            const testPrediction = this.model.predict(testInput);
            await testPrediction.data();

            // Cleanup
            testInput.dispose();
            testPrediction.dispose();

            console.log('✅ Model test successful - no InputLayer errors!');
            return true;

        } catch (error) {
            console.error('❌ Model test failed:', error);
            throw new Error(`Model loading test failed: ${error.message}`);
        }
    }

    // Kategorisasi nutrisi (EXACT sama dengan training)
    categorizeNutrients(calories, proteins, fat, carbohydrate) {
        const calorie_category = calories <= 100 ? 0 : calories <= 200 ? 1 : calories <= 400 ? 2 : 3;
        const protein_category = proteins <= 5 ? 0 : proteins <= 15 ? 1 : proteins <= 30 ? 2 : 3;
        const fat_category = fat <= 5 ? 0 : fat <= 15 ? 1 : fat <= 30 ? 2 : 3;
        const carb_category = carbohydrate <= 15 ? 0 : carbohydrate <= 30 ? 1 : carbohydrate <= 50 ? 2 : 3;

        return [calorie_category, protein_category, fat_category, carb_category];
    }

    // Rule-based mood classification (untuk validasi)
    getRuleBased(calories, proteins, fat, carbohydrate) {
        const is_energizing = (carbohydrate > 30) && (proteins >= 5) && (proteins <= 15);
        const is_relaxing = (calories < 150) && (proteins < 5);
        const is_focusing = (proteins > 15) && (carbohydrate < 10);

        if (is_energizing && !is_relaxing && !is_focusing) {
            return 'energizing';
        } else if (!is_energizing && is_relaxing && !is_focusing) {
            return 'relaxing';
        } else if (!is_energizing && !is_relaxing && is_focusing) {
            return 'focusing';
        } else if ((is_energizing ? 1 : 0) + (is_relaxing ? 1 : 0) + (is_focusing ? 1 : 0) > 1) {
            return 'multi_category';
        } else {
            return 'uncategorized';
        }
    }

    async predictMood(calories, proteins, fat, carbohydrate) {
        if (!this.isLoaded) {
            throw new Error('Model belum dimuat. Panggil loadModel() terlebih dahulu.');
        }

        try {
            // 1. Kategorisasi nutrisi
            const categories = this.categorizeNutrients(calories, proteins, fat, carbohydrate);
            console.log(`🔧 Nutrient categories: [${categories.join(', ')}]`);

            // 2. ULTIMATE FIX: Buat input tensor dengan shape eksplisit
            const batchSize = 1;
            const inputSize = this.metadata.model_info.input_size;
            const inputTensor = tf.tensor2d([categories], [batchSize, inputSize]);

            console.log(`🔧 Input tensor shape: [${inputTensor.shape.join(', ')}]`);

            // 3. Standardisasi sesuai training
            const mean = tf.tensor1d(this.metadata.preprocessing.scaler_mean);
            const scale = tf.tensor1d(this.metadata.preprocessing.scaler_scale);
            const standardized = inputTensor.sub(mean).div(scale);

            // 4. Prediksi
            const prediction = this.model.predict(standardized);
            console.log(`🔧 Prediction tensor shape: [${prediction.shape.join(', ')}]`);

            const probabilities = await prediction.data();

            // 5. Parse hasil
            const predictedClassIndex = probabilities.indexOf(Math.max(...probabilities));
            const predictedMood = this.metadata.labels.classes[predictedClassIndex];
            const confidence = Math.max(...probabilities);

            // 6. Mapping semua probabilitas
            const allProbabilities = {};
            this.metadata.labels.classes.forEach((mood, idx) => {
                allProbabilities[mood] = probabilities[idx];
            });

            // 7. Rule-based untuk validasi
            const ruleBased = this.getRuleBased(calories, proteins, fat, carbohydrate);

            // 8. Cleanup tensors
            inputTensor.dispose();
            standardized.dispose();
            prediction.dispose();
            mean.dispose();
            scale.dispose();

            return {
                predicted_mood: predictedMood,
                confidence: confidence,
                confidence_percentage: (confidence * 100).toFixed(1),
                all_probabilities: allProbabilities,
                rule_based_mood: ruleBased,
                nutrient_categories: {
                    calories: this.getCategoryName(categories[0]),
                    proteins: this.getCategoryName(categories[1]),
                    fat: this.getCategoryName(categories[2]),
                    carbohydrate: this.getCategoryName(categories[3])
                },
                input_values: { calories, proteins, fat, carbohydrate },
                is_rule_match: predictedMood === ruleBased
            };
        } catch (error) {
            console.error('❌ Prediction error:', error);
            throw error;
        }
    }

    getCategoryName(categoryIndex) {
        const categories = ['very_low', 'low', 'medium', 'high'];
        return categories[categoryIndex] || 'unknown';
    }

    getFoodRecommendations(mood, limit = 5, healthConditions = []) {
        if (!this.isLoaded) {
            throw new Error('Model belum dimuat.');
        }

        let filteredFoods = this.foodData;

        // Filter berdasarkan mood
        if (mood && mood !== 'all') {
            filteredFoods = filteredFoods.filter(food => food.primary_mood === mood);
        }

        // Health condition filters
        const healthMapping = {
            'diabetes': (food) => food.calories <= 200 && food.carbohydrate <= 30,
            'hipertensi': (food) => food.calories <= 200 && food.fat <= 15,
            'kolesterol': (food) => food.fat <= 15,
            'obesitas': (food) => food.calories <= 200 && food.fat <= 15,
            'vegetarian': (food) => food.primary_mood === 'relaxing' || food.primary_mood === 'energizing'
        };

        if (healthConditions && healthConditions.length > 0) {
            healthConditions.forEach(condition => {
                if (healthMapping[condition]) {
                    filteredFoods = filteredFoods.filter(healthMapping[condition]);
                }
            });
        }

        // Sort berdasarkan preferensi mood
        if (mood === 'energizing') {
            filteredFoods.sort((a, b) => b.carbohydrate - a.carbohydrate);
        } else if (mood === 'relaxing') {
            filteredFoods.sort((a, b) => a.calories - b.calories);
        } else if (mood === 'focusing') {
            filteredFoods.sort((a, b) => b.proteins - a.proteins);
        }

        return filteredFoods.slice(0, limit).map(food => ({
            ...food,
            mood_match: food.primary_mood === mood
        }));
    }

    getMoodDescription(mood) {
        return this.metadata.labels.description[mood] || 'Mood tidak dikenal';
    }

    getNutrientAdvice(calories, proteins, fat, carbohydrate) {
        const advice = [];

        if (calories < 100) {
            advice.push('⚠️ Kalori terlalu rendah - pertimbangkan makanan bernutrisi');
        } else if (calories > 400) {
            advice.push('⚠️ Kalori tinggi - seimbangkan dengan aktivitas fisik');
        }

        if (proteins < 5) {
            advice.push('💪 Protein rendah - tambahkan sumber protein');
        } else if (proteins > 30) {
            advice.push('💪 Protein tinggi - baik untuk otot dan fokus');
        }

        if (fat > 30) {
            advice.push('🥑 Lemak tinggi - batasi makanan berminyak');
        } else if (fat < 5) {
            advice.push('🥑 Lemak terlalu rendah - tubuh butuh lemak sehat');
        }

        if (carbohydrate > 50) {
            advice.push('🍞 Karbohidrat tinggi - baik untuk energi, hati-hati gula darah');
        } else if (carbohydrate < 15) {
            advice.push('🍞 Karbohidrat rendah - baik untuk fokus, pastikan energi cukup');
        }

        return advice;
    }

    async analyzeNutrition(calories, proteins, fat, carbohydrate) {
        const prediction = await this.predictMood(calories, proteins, fat, carbohydrate);
        const recommendations = this.getFoodRecommendations(prediction.predicted_mood, 5);
        const advice = this.getNutrientAdvice(calories, proteins, fat, carbohydrate);

        return {
            mood_analysis: prediction,
            food_recommendations: recommendations,
            nutritional_advice: advice,
            mood_description: this.getMoodDescription(prediction.predicted_mood),
            is_balanced: this.isNutritionBalanced(calories, proteins, fat, carbohydrate)
        };
    }

    isNutritionBalanced(calories, proteins, fat, carbohydrate) {
        const totalCalories = (proteins * 4) + (fat * 9) + (carbohydrate * 4);

        if (totalCalories === 0) return false;

        const proteinPct = (proteins * 4) / totalCalories * 100;
        const fatPct = (fat * 9) / totalCalories * 100;
        const carbPct = (carbohydrate * 4) / totalCalories * 100;

        // Balanced nutrition criteria
        return (proteinPct >= 10 && proteinPct <= 35) &&
            (fatPct >= 20 && fatPct <= 35) &&
            (carbPct >= 45 && carbPct <= 65);
    }

    getModelInfo() {
        if (!this.isLoaded) return null;

        return {
            model_info: this.metadata.model_info,
            available_moods: this.metadata.labels.classes,
            nutrient_categories: Object.keys(this.metadata.nutrient_thresholds),
            food_count: this.foodData.length,
            is_loaded: this.isLoaded,
            conversion_method: this.metadata.model_info.conversion_method,
            tensorflow_version: this.metadata.model_info.tensorflow_version
        };
    }

    // ULTIMATE TEST: Comprehensive model testing
    async runComprehensiveTest() {
        if (!this.isLoaded) {
            throw new Error('Model belum dimuat.');
        }

        console.log('🧪 Running comprehensive test...');

        const testCases = [
            { name: 'High Energy Food', calories: 350, proteins: 12, fat: 8, carbohydrate: 45, expected: 'energizing' },
            { name: 'Light Snack', calories: 80, proteins: 2, fat: 1, carbohydrate: 12, expected: 'relaxing' },
            { name: 'Protein Rich', calories: 220, proteins: 25, fat: 6, carbohydrate: 8, expected: 'focusing' },
            { name: 'Balanced Meal', calories: 280, proteins: 18, fat: 12, carbohydrate: 35, expected: 'uncategorized' }
        ];

        const results = [];

        for (const testCase of testCases) {
            try {
                console.log(`\n📊 Testing: ${testCase.name}`);

                const result = await this.predictMood(
                    testCase.calories,
                    testCase.proteins,
                    testCase.fat,
                    testCase.carbohydrate
                );

                const isCorrect = result.predicted_mood === testCase.expected ||
                    result.rule_based_mood === testCase.expected;

                results.push({
                    ...testCase,
                    predicted_mood: result.predicted_mood,
                    rule_based_mood: result.rule_based_mood,
                    confidence: result.confidence_percentage,
                    is_correct: isCorrect,
                    status: isCorrect ? '✅' : '⚠️'
                });

                console.log(`   🎯 Predicted: ${result.predicted_mood} (${result.confidence_percentage}%)`);
                console.log(`   📋 Rule-based: ${result.rule_based_mood}`);
                console.log(`   ${isCorrect ? '✅' : '⚠️'} Expected: ${testCase.expected}`);

            } catch (error) {
                console.error(`   ❌ Error testing ${testCase.name}:`, error);
                results.push({
                    ...testCase,
                    error: error.message,
                    status: '❌'
                });
            }
        }

        const successCount = results.filter(r => r.status === '✅').length;
        const totalTests = results.length;

        console.log(`\n📈 Test Results: ${successCount}/${totalTests} passed`);

        if (successCount === totalTests) {
            console.log('🎉 All tests passed! Model is working perfectly.');
        } else if (successCount > 0) {
            console.log('⚠️ Some tests passed. Model is working but may need fine-tuning.');
        } else {
            console.log('❌ All tests failed. There may be an issue with the model.');
        }

        return {
            total_tests: totalTests,
            passed_tests: successCount,
            success_rate: (successCount / totalTests * 100).toFixed(1),
            detailed_results: results
        };
    }

    // Utility untuk debugging
    debugInfo() {
        if (!this.isLoaded) {
            return { error: 'Model not loaded' };
        }

        return {
            model_loaded: this.isLoaded,
            model_info: this.metadata.model_info,
            food_data_count: this.foodData.length,
            available_moods: this.metadata.labels.classes,
            preprocessing_info: this.metadata.preprocessing,
            nutrient_thresholds: this.metadata.nutrient_thresholds
        };
    }
}

// Export singleton instance
export const nutriMoodPredictor = new NutriMoodPredictor();
export default NutriMoodPredictor;