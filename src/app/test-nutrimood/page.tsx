"use client";
import { useEffect, useState } from "react";
import { nutriMoodPredictor } from "@/utils/nutrimood";

export default function TestNutriMood() {
  const [status, setStatus] = useState("loading");
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testModel() {
      try {
        setStatus("loading");
        setError(null);
        // Load model
        await nutriMoodPredictor.loadModel("/tfjs_model");
        // Test prediksi dengan data dummy
        const result = await nutriMoodPredictor.predictMood(250, 12, 8, 35);
        setTestResult(result);
        setStatus("ready");
      } catch (err: any) {
        setError(err?.message || String(err));
        setStatus("error");
      }
    }
    testModel();
  }, []);

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test NutriMood Model</h1>
      <div className="mb-4">
        <p>
          Status: <span className="font-bold">{status}</span>
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mt-2">
            <b>Error:</b> {error}
          </div>
        )}
        {status === "ready" && testResult && (
          <div className="bg-green-100 text-green-800 p-4 rounded mt-2">
            <b>Prediksi Berhasil!</b>
            <div className="mt-2">
              <div>
                <b>Predicted Mood:</b> {testResult.predicted_mood}
              </div>
              <div>
                <b>Confidence:</b> {testResult.confidence_percentage}%
              </div>
              <div>
                <b>Rule-based Mood:</b> {testResult.rule_based_mood}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Input: 250 kalori, 12 protein, 8 lemak, 35 karbohidrat
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8 text-gray-500 text-sm">
        Halaman ini digunakan untuk memastikan model tfjs bisa di-load dan
        dipakai prediksi di frontend. Jika status <b>ready</b> dan prediksi
        berhasil, berarti model sudah benar.
      </div>
    </div>
  );
}
