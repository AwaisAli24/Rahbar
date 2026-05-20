import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import os

# 1. Generate Synthetic Student Data
print("Generating synthetic student academic data...")
np.random.seed(42)
num_samples = 1500

# Features:
# - attendance_rate (40% to 100%)
# - quiz_avg (20% to 100%)
# - assignment_avg (20% to 100%)
# - midterm_score (20% to 100%)
# - base_cgpa (1.5 to 4.0)
attendance_rate = np.random.uniform(40, 100, num_samples)
quiz_avg = np.random.uniform(20, 100, num_samples)
assignment_avg = np.random.uniform(20, 100, num_samples)
midterm_score = np.random.uniform(20, 100, num_samples)
base_cgpa = np.random.uniform(1.5, 4.0, num_samples)

# Create a DataFrame
df = pd.DataFrame({
    'attendance_rate': attendance_rate,
    'quiz_avg': quiz_avg,
    'assignment_avg': assignment_avg,
    'midterm_score': midterm_score,
    'base_cgpa': base_cgpa
})

# Calculate risk index to determine target class (passed_course: 1 = Pass, 0 = Fail)
# Failing is modeled as: low grades, low attendance, or low GPA.
# We build a weighted index:
weighted_score = (
    0.30 * df['attendance_rate'] +
    0.25 * df['midterm_score'] +
    0.20 * df['quiz_avg'] +
    0.15 * df['assignment_avg'] +
    0.10 * (df['base_cgpa'] / 4.0 * 100) # scale cgpa to 100
)

# Add random noise to make the dataset realistic and non-deterministic
noise = np.random.normal(0, 5, num_samples)
final_score = weighted_score + noise

# Threshold for passing is a final score of 50
df['passed'] = (final_score >= 52).astype(int)

# Force fail if attendance is critically low (< 50%) or midterm is extremely low (< 25%) with high probability
for i in range(num_samples):
    if df.loc[i, 'attendance_rate'] < 50 and np.random.rand() > 0.15:
        df.loc[i, 'passed'] = 0
    if df.loc[i, 'midterm_score'] < 30 and np.random.rand() > 0.2:
        df.loc[i, 'passed'] = 0

# Save dataset to CSV for record keeping
csv_path = 'student_data.csv'
df.to_csv(csv_path, index=False)
print(f"Dataset saved to '{csv_path}'. Shape: {df.shape}")
print(f"Pass/Fail distribution:\n{df['passed'].value_counts()}")

# 2. Split Features and Target
X = df.drop('passed', axis=1)
y = df['passed']

# Split into train/test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Scale Features (Crucial for consistent inputs)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. Train Random Forest Classifier
print("Training Random Forest Classifier model...")
model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
model.fit(X_train_scaled, y_train)

# 5. Evaluate the Model
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nModel Evaluation:")
print(f"Accuracy: {accuracy:.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['At Risk (Fail)', 'Safe (Pass)']))

# 6. Save Model and Scaler artifacts
os.makedirs('model_artifacts', exist_ok=True)
joblib.dump(model, 'model_artifacts/student_risk_model.pkl')
joblib.dump(scaler, 'model_artifacts/scaler.pkl')
print("Model and Scaler successfully serialized to 'model_artifacts/' directory.")
