#!/usr/bin/env python3
"""
Fast training script - single model without grid search
"""

import os
import sys
import json
import hashlib
import joblib
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report
import re

RANDOM_SEED = 42
MIN_ACCURACY_THRESHOLD = 0.88

# Load data
print("Loading data...")
df = pd.read_csv(sys.argv[1])
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Clean
print("Cleaning...")
df = df.dropna(subset=['merchant', 'category', 'amount'])
df = df[df['amount'] > 0]

# Split
print("Splitting...")
train, test = train_test_split(df, test_size=0.2, random_state=RANDOM_SEED, stratify=df['category'])

# Simple features
print("Feature engineering...")
def normalize_merchant(m):
    return re.sub(r'[^a-z0-9]', '', str(m).lower())

train['merchant_norm'] = train['merchant'].apply(normalize_merchant)
test['merchant_norm'] = test['merchant'].apply(normalize_merchant)

merchant_enc = LabelEncoder()
channel_enc = LabelEncoder()

train['merchant_enc'] = merchant_enc.fit_transform(train['merchant_norm'])
train['channel_enc'] = channel_enc.fit_transform(train['channel'].fillna('unknown'))
train['amount_log'] = np.log1p(train['amount'])
train['hour'] = train['timestamp'].dt.hour
train['day_of_week'] = train['timestamp'].dt.dayofweek

test['merchant_enc'] = test['merchant_norm'].apply(
    lambda x: merchant_enc.transform([x])[0] if x in merchant_enc.classes_ else -1
)
test['channel_enc'] = test['channel'].fillna('unknown').apply(
    lambda x: channel_enc.transform([x])[0] if x in channel_enc.classes_ else -1
)
test['amount_log'] = np.log1p(test['amount'])
test['hour'] = test['timestamp'].dt.hour
test['day_of_week'] = test['timestamp'].dt.dayofweek

features = ['merchant_enc', 'channel_enc', 'amount_log', 'hour', 'day_of_week']
X_train = train[features].fillna(0)
y_train = train['category']
X_test = test[features].fillna(0)
y_test = test['category']

# Train
print("Training Random Forest...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=10,
    class_weight='balanced',
    random_state=RANDOM_SEED,
    n_jobs=-1
)
model.fit(X_train, y_train)

# Evaluate
print("\nEvaluating...")
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='macro')

print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

if accuracy >= MIN_ACCURACY_THRESHOLD:
    print(f"✅ Model meets {MIN_ACCURACY_THRESHOLD} accuracy threshold!")
else:
    print(f"⚠️  Model below {MIN_ACCURACY_THRESHOLD} threshold")

# Save
print("\nSaving model...")
output_dir = sys.argv[2]
os.makedirs(output_dir, exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
version = f"1.0.0_{timestamp}"

model_path = os.path.join(output_dir, f"model_{version}.joblib")
joblib.dump(model, model_path, compress=3)

encoders = {
    'merchant_encoder': merchant_enc,
    'channel_encoder': channel_enc,
    'features': features
}
encoder_path = os.path.join(output_dir, f"encoders_{version}.joblib")
joblib.dump(encoders, encoder_path, compress=3)

metadata = {
    'version': version,
    'accuracy': accuracy,
    'precision': precision,
    'recall': recall,
    'f1': f1,
    'features': features,
    'model_path': model_path,
    'encoder_path': encoder_path
}

metadata_path = os.path.join(output_dir, f"metadata_{version}.json")
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"Model saved: {model_path}")
print(f"Encoders saved: {encoder_path}")
print(f"Metadata saved: {metadata_path}")
print(f"Version: {version}")

print("\n✅ Training complete!")
