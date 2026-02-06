#!/usr/bin/env python3
"""
KOMPLEET ML Inference Service
Provides transaction categorization predictions via HTTP API
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import re
from datetime import datetime
from flask import Flask, request, jsonify
from functools import lru_cache

app = Flask(__name__)

# Configuration
MODEL_DIR = os.getenv('MODEL_DIR', '/home/ubuntu/kompleet-web/.ml-models-cache')
MODEL_VERSION = 'v1.0.0'
S3_BASE_URL = 'https://kompleet-ml-models.s3.eu-west-1.amazonaws.com'
PORT = int(os.getenv('ML_SERVICE_PORT', 5000))

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def download_model_file(s3_key: str, local_path: str):
    """Download model file from S3 if not cached"""
    if os.path.exists(local_path):
        print(f"✅ {os.path.basename(local_path)} already cached")
        return
    
    import urllib.request
    url = f"{S3_BASE_URL}/{s3_key}"
    print(f"Downloading {os.path.basename(local_path)} from S3...")
    urllib.request.urlretrieve(url, local_path)
    size_mb = os.path.getsize(local_path) / (1024 * 1024)
    print(f"✅ Downloaded {os.path.basename(local_path)} ({size_mb:.2f} MB)")

# Download models from S3
print(f"Loading model version {MODEL_VERSION}...")
model_path = os.path.join(MODEL_DIR, f'model-{MODEL_VERSION}.joblib')
encoder_path = os.path.join(MODEL_DIR, f'encoders-{MODEL_VERSION}.joblib')
metadata_path = os.path.join(MODEL_DIR, f'metadata-{MODEL_VERSION}.json')

download_model_file(f'{MODEL_VERSION}/model.joblib', model_path)
download_model_file(f'{MODEL_VERSION}/encoders.joblib', encoder_path)
download_model_file(f'{MODEL_VERSION}/metadata.json', metadata_path)

# Load models
model = joblib.load(model_path)
encoders = joblib.load(encoder_path)
with open(metadata_path, 'r') as f:
    metadata = json.load(f)

merchant_encoder = encoders['merchant_encoder']
channel_encoder = encoders['channel_encoder']
features = encoders['features']

print(f"Model loaded successfully!")
print(f"Accuracy: {metadata['accuracy']:.4f}")
print(f"Features: {features}")


def normalize_merchant(merchant: str) -> str:
    """Normalize merchant name"""
    if not merchant:
        return "unknown"
    merchant = str(merchant).lower().strip()
    merchant = re.sub(r'[^a-z0-9]', '', merchant)
    return merchant


def extract_features(transaction: dict) -> dict:
    """Extract features from transaction"""
    # Normalize merchant
    merchant_norm = normalize_merchant(transaction.get('merchant', ''))
    
    # Encode merchant (handle unknown merchants)
    if merchant_norm in merchant_encoder.classes_:
        merchant_enc = merchant_encoder.transform([merchant_norm])[0]
    else:
        merchant_enc = -1
    
    # Encode channel (handle unknown channels)
    channel = transaction.get('channel', 'unknown')
    if channel in channel_encoder.classes_:
        channel_enc = channel_encoder.transform([channel])[0]
    else:
        channel_enc = -1
    
    # Amount features
    amount = float(transaction.get('amount', 0))
    amount_log = np.log1p(amount)
    
    # Temporal features
    timestamp_str = transaction.get('timestamp')
    if timestamp_str:
        try:
            timestamp = pd.to_datetime(timestamp_str)
            hour = timestamp.hour
            day_of_week = timestamp.dayofweek
        except:
            hour = 12  # Default to noon
            day_of_week = 2  # Default to Wednesday
    else:
        hour = 12
        day_of_week = 2
    
    return {
        'merchant_enc': merchant_enc,
        'channel_enc': channel_enc,
        'amount_log': amount_log,
        'hour': hour,
        'day_of_week': day_of_week
    }


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_version': MODEL_VERSION,
        'accuracy': metadata['accuracy']
    })


@app.route('/categorize', methods=['POST'])
def categorize():
    """Categorize transaction"""
    try:
        # Parse request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing request body'}), 400
        
        # Validate required fields
        if 'merchant' not in data or 'amount' not in data:
            return jsonify({'error': 'Missing required fields: merchant, amount'}), 400
        
        # Extract features
        feature_dict = extract_features(data)
        X = pd.DataFrame([feature_dict])[features]
        
        # Predict
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        
        # Get top 3 predictions
        top_indices = np.argsort(probabilities)[::-1][:3]
        alternatives = []
        for idx in top_indices[1:]:  # Skip the top prediction
            category = model.classes_[idx]
            confidence = float(probabilities[idx])
            if confidence > 0.05:  # Only include if confidence > 5%
                alternatives.append({
                    'category': category,
                    'confidence': confidence
                })
        
        # Build response
        response = {
            'category': prediction,
            'confidence': float(probabilities[top_indices[0]]),
            'alternatives': alternatives,
            'model_version': MODEL_VERSION,
            'inference_id': f"inf_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error in categorize: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/batch-categorize', methods=['POST'])
def batch_categorize():
    """Batch categorize multiple transactions"""
    try:
        # Parse request
        data = request.get_json()
        
        if not data or 'transactions' not in data:
            return jsonify({'error': 'Missing transactions array'}), 400
        
        transactions = data['transactions']
        
        if not isinstance(transactions, list):
            return jsonify({'error': 'transactions must be an array'}), 400
        
        # Extract features for all transactions
        feature_dicts = [extract_features(txn) for txn in transactions]
        X = pd.DataFrame(feature_dicts)[features]
        
        # Batch predict
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Build responses
        results = []
        for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
            top_indices = np.argsort(probs)[::-1][:3]
            alternatives = []
            for idx in top_indices[1:]:
                category = model.classes_[idx]
                confidence = float(probs[idx])
                if confidence > 0.05:
                    alternatives.append({
                        'category': category,
                        'confidence': confidence
                    })
            
            results.append({
                'category': pred,
                'confidence': float(probs[top_indices[0]]),
                'alternatives': alternatives
            })
        
        return jsonify({
            'results': results,
            'model_version': MODEL_VERSION,
            'count': len(results)
        })
    
    except Exception as e:
        print(f"Error in batch_categorize: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(f"Starting ML Inference Service on port {PORT}...")
    print(f"Model version: {MODEL_VERSION}")
    print(f"Endpoints:")
    print(f"  GET  /health - Health check")
    print(f"  POST /categorize - Single transaction categorization")
    print(f"  POST /batch-categorize - Batch transaction categorization")
    app.run(host='0.0.0.0', port=PORT, debug=False)
