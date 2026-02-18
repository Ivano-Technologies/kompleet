#!/usr/bin/env python3
"""
KOMPLEET ML Inference Service
Provides transaction categorization predictions via HTTP API
CRIT-004: Improved OOV (Out-of-Vocabulary) merchant handling with similarity matching
HIGH-003: Added configurable confidence thresholds
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
from difflib import SequenceMatcher

app = Flask(__name__)

# Configuration
MODEL_DIR = os.getenv('MODEL_DIR', '/home/ubuntu/kompleet-web/.ml-models-cache')
MODEL_VERSION = 'v1.0.0'
S3_BASE_URL = 'https://kompleet-ml-models.s3.eu-west-1.amazonaws.com'
PORT = int(os.getenv('ML_SERVICE_PORT', 5000))

# HIGH-003: Confidence thresholds
CONFIDENCE_THRESHOLDS = {
    'AUTO_ACCEPT': float(os.getenv('ML_AUTO_ACCEPT_THRESHOLD', '0.80')),
    'SUGGEST': float(os.getenv('ML_SUGGEST_THRESHOLD', '0.50')),
    'MANUAL_REVIEW': 0.00
}

# CRIT-004: OOV similarity threshold
OOV_SIMILARITY_THRESHOLD = 0.7

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
    try:
        urllib.request.urlretrieve(url, local_path)
        size_mb = os.path.getsize(local_path) / (1024 * 1024)
        print(f"✅ Downloaded {os.path.basename(local_path)} ({size_mb:.2f} MB)")
    except Exception as e:
        print(f"⚠️ Failed to download {os.path.basename(local_path)}: {e}")
        # Continue without the file if it fails

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
print(f"Confidence thresholds: {CONFIDENCE_THRESHOLDS}")


def normalize_merchant(merchant: str) -> str:
    """Normalize merchant name"""
    if not merchant:
        return "unknown"
    merchant = str(merchant).lower().strip()
    merchant = re.sub(r'[^a-z0-9]', '', merchant)
    return merchant


def calculate_similarity(s1: str, s2: str) -> float:
    """
    CRIT-004: Calculate similarity between two strings using SequenceMatcher
    Returns a value between 0 and 1
    """
    return SequenceMatcher(None, s1, s2).ratio()


def extract_features(transaction: dict) -> dict:
    """
    Extract features from transaction
    CRIT-004: Enhanced with similarity-based OOV handling
    """
    # Normalize merchant
    merchant_norm = normalize_merchant(transaction.get('merchant', ''))
    
    # CRIT-004: Improved OOV handling with similarity matching
    merchant_confidence = 1.0
    if merchant_norm in merchant_encoder.classes_:
        merchant_enc = merchant_encoder.transform([merchant_norm])[0]
    else:
        # Find most similar known merchant
        best_match = None
        best_score = 0
        for known_merchant in merchant_encoder.classes_:
            score = calculate_similarity(merchant_norm, known_merchant)
            if score > best_score and score > OOV_SIMILARITY_THRESHOLD:
                best_score = score
                best_match = known_merchant
        
        if best_match:
            # Use similar merchant encoding
            merchant_enc = merchant_encoder.transform([best_match])[0]
            merchant_confidence = best_score
            print(f"OOV merchant '{merchant_norm}' matched to '{best_match}' (similarity: {best_score:.2f})")
        else:
            # Use middle value as default for unknown merchants
            merchant_enc = len(merchant_encoder.classes_) // 2
            merchant_confidence = 0.0
            print(f"OOV merchant '{merchant_norm}' - no similar match found")
    
    # Encode channel (handle unknown channels)
    channel = transaction.get('channel', 'unknown')
    if channel in channel_encoder.classes_:
        channel_enc = channel_encoder.transform([channel])[0]
    else:
        channel_enc = len(channel_encoder.classes_) // 2
    
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
        'day_of_week': day_of_week,
        'merchant_confidence': merchant_confidence
    }


def get_recommendation(confidence: float) -> str:
    """
    HIGH-003: Determine recommendation based on confidence threshold
    """
    if confidence >= CONFIDENCE_THRESHOLDS['AUTO_ACCEPT']:
        return 'AUTO_ACCEPT'
    elif confidence >= CONFIDENCE_THRESHOLDS['SUGGEST']:
        return 'SUGGEST'
    else:
        return 'MANUAL_REVIEW'


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_version': MODEL_VERSION,
        'accuracy': metadata['accuracy'],
        'confidence_thresholds': CONFIDENCE_THRESHOLDS
    })


@app.route('/categorize', methods=['POST'])
def categorize():
    """
    Categorize transaction
    HIGH-003: Enhanced with confidence-based recommendations
    """
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
        merchant_confidence = feature_dict.pop('merchant_confidence', 1.0)
        
        X = pd.DataFrame([feature_dict])[features]
        
        # Predict
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        
        # Get top prediction confidence
        top_indices = np.argsort(probabilities)[::-1][:3]
        confidence = float(probabilities[top_indices[0]])
        
        # Adjust confidence based on merchant match quality
        adjusted_confidence = confidence * merchant_confidence
        
        # HIGH-003: Get recommendation based on threshold
        recommendation = get_recommendation(adjusted_confidence)
        
        # Get top 3 predictions
        alternatives = []
        for idx in top_indices[1:]:  # Skip the top prediction
            category = model.classes_[idx]
            alt_confidence = float(probabilities[idx])
            if alt_confidence > 0.05:  # Only include if confidence > 5%
                alternatives.append({
                    'category': category,
                    'confidence': alt_confidence
                })
        
        # Build response
        response = {
            'category': prediction,
            'confidence': confidence,
            'adjusted_confidence': adjusted_confidence,
            'merchant_confidence': merchant_confidence,
            'recommendation': recommendation,
            'alternatives': alternatives,
            'model_version': MODEL_VERSION,
            'inference_id': f"inf_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        }
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error in categorize: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/batch-categorize', methods=['POST'])
def batch_categorize():
    """
    Batch categorize multiple transactions
    HIGH-003: Enhanced with confidence-based recommendations
    """
    try:
        # Parse request
        data = request.get_json()
        
        if not data or 'transactions' not in data:
            return jsonify({'error': 'Missing transactions array'}), 400
        
        transactions = data['transactions']
        
        if not isinstance(transactions, list):
            return jsonify({'error': 'transactions must be an array'}), 400
        
        # Extract features for all transactions
        feature_dicts = []
        merchant_confidences = []
        for txn in transactions:
            feat_dict = extract_features(txn)
            merchant_conf = feat_dict.pop('merchant_confidence', 1.0)
            feature_dicts.append(feat_dict)
            merchant_confidences.append(merchant_conf)
        
        X = pd.DataFrame(feature_dicts)[features]
        
        # Batch predict
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Build responses
        results = []
        for i, (pred, probs, merchant_conf) in enumerate(zip(predictions, probabilities, merchant_confidences)):
            top_indices = np.argsort(probs)[::-1][:3]
            confidence = float(probs[top_indices[0]])
            adjusted_confidence = confidence * merchant_conf
            
            alternatives = []
            for idx in top_indices[1:]:
                category = model.classes_[idx]
                alt_confidence = float(probs[idx])
                if alt_confidence > 0.05:
                    alternatives.append({
                        'category': category,
                        'confidence': alt_confidence
                    })
            
            results.append({
                'category': pred,
                'confidence': confidence,
                'adjusted_confidence': adjusted_confidence,
                'merchant_confidence': merchant_conf,
                'recommendation': get_recommendation(adjusted_confidence),
                'alternatives': alternatives
            })
        
        return jsonify({
            'results': results,
            'model_version': MODEL_VERSION,
            'count': len(results)
        })
    
    except Exception as e:
        print(f"Error in batch_categorize: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(f"Starting ML Inference Service on port {PORT}...")
    print(f"Model version: {MODEL_VERSION}")
    print(f"Endpoints:")
    print(f"  GET  /health - Health check")
    print(f"  POST /categorize - Single transaction categorization")
    print(f"  POST /batch-categorize - Batch transaction categorization")
    app.run(host='0.0.0.0', port=PORT, debug=False)
