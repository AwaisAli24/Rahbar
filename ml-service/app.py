from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app) # Enable CORS for cross-origin requests from Node.js or browser

# Path to serialized model and scaler
MODEL_PATH = 'model_artifacts/student_risk_model.pkl'
SCALER_PATH = 'model_artifacts/scaler.pkl'

# Load the trained model and scaler
if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    print("Loading ML model and feature scaler...")
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("Model and scaler successfully loaded!")
else:
    print("CRITICAL: Model or Scaler not found! Run 'train_model.py' first.")
    model = None
    scaler = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or scaler is None:
        return jsonify({
            "success": False,
            "message": "ML Model is not loaded on the server."
        }), 500

    try:
        data = request.get_json()

        # Extract features from request
        attendance_rate = float(data.get('attendance_rate', 100.0))
        quiz_avg = float(data.get('quiz_avg', 100.0))
        assignment_avg = float(data.get('assignment_avg', 100.0))
        midterm_score = float(data.get('midterm_score', 100.0))
        base_cgpa = float(data.get('base_cgpa', 4.0))

        # Format input array for scaling: shape (1, 5)
        features = np.array([[attendance_rate, quiz_avg, assignment_avg, midterm_score, base_cgpa]])
        
        # Scale features using standard scaler
        features_scaled = scaler.transform(features)

        # Get binary prediction (0 = Fail, 1 = Pass)
        prediction = int(model.predict(features_scaled)[0])

        # Get prediction probabilities: shape (1, 2)
        # index 0 is Fail probability, index 1 is Pass probability
        probabilities = model.predict_proba(features_scaled)[0]
        fail_prob = float(probabilities[0]) # Risk of failing

        # Classify risk status based on failure probability
        if fail_prob >= 0.80:
            risk_status = "Critical Risk"
        elif fail_prob >= 0.60:
            risk_status = "High Risk"
        elif fail_prob >= 0.30:
            risk_status = "Moderate Risk"
        else:
            risk_status = "Safe"

        return jsonify({
            "success": True,
            "prediction": prediction, # 1 for pass, 0 for fail
            "fail_probability": round(fail_prob, 4), # e.g. 0.85
            "risk_percentage": round(fail_prob * 100, 2), # e.g. 85.0%
            "risk_status": risk_status
        }), 200

    except ValueError as val_err:
        return jsonify({
            "success": False,
            "message": f"Invalid parameter type: {str(val_err)}"
        }), 400
    except Exception as err:
        return jsonify({
            "success": False,
            "message": f"Server error: {str(err)}"
        }), 500

if __name__ == '__main__':
    # Run the server on port 5001 (Node runs on 5000)
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
