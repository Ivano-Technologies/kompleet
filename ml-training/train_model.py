#!/usr/bin/env python3
"""
KOMPLEET ML Training Pipeline
Sprint 11-12: Transaction Categorization Model

This script trains a Random Forest classifier for Nigerian transaction categorization.
Target accuracy: >= 88% overall, >= 75% per category F1 score.
"""

import os
import sys
import json
import hashlib
import joblib
from datetime import datetime
from typing import Dict, List, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)
import re
from collections import Counter

# Configuration
RANDOM_SEED = 42
TEST_SIZE = 0.15
VAL_SIZE = 0.15
MIN_ACCURACY_THRESHOLD = 0.88
MIN_CATEGORY_F1_THRESHOLD = 0.75

# Nigerian transaction categories
CATEGORIES = [
    "Groceries",
    "Food & Dining",
    "Transportation",
    "Utilities",
    "Healthcare",
    "Education",
    "Entertainment",
    "Shopping",
    "Personal Care",
    "Home & Garden",
    "Travel",
    "Insurance",
    "Investments",
    "Rent",
    "Salary",
    "Business",
    "Gifts & Donations",
    "Taxes",
    "Other"
]

# Nigerian merchant patterns
MERCHANT_PATTERNS = {
    "Groceries": ["shoprite", "spar", "game", "ebeano", "market", "supermarket"],
    "Food & Dining": ["restaurant", "kfc", "dominos", "chicken republic", "sweet sensation", "bukka"],
    "Transportation": ["uber", "bolt", "lagos ride", "fuel", "petrol", "filling station"],
    "Utilities": ["ekedc", "ikedc", "dstv", "gotv", "mtn", "glo", "airtel", "9mobile"],
    "Healthcare": ["hospital", "pharmacy", "medplus", "healthplus", "clinic"],
    "Education": ["school", "university", "college", "tuition", "books"],
    "Entertainment": ["cinema", "filmhouse", "genesis", "silverbird", "netflix", "spotify"],
    "Shopping": ["jumia", "konga", "mall", "boutique", "fashion"],
    "Personal Care": ["salon", "barber", "spa", "beauty"],
    "Home & Garden": ["furniture", "home", "garden", "hardware"],
    "Travel": ["hotel", "flight", "booking", "travel", "tour"],
    "Insurance": ["insurance", "axa", "aiico", "leadway"],
    "Investments": ["investment", "mutual fund", "stock", "bond"],
    "Rent": ["rent", "lease", "landlord"],
    "Salary": ["salary", "wage", "payroll"],
    "Business": ["business", "vendor", "supplier", "invoice"],
}


class FeatureEngineer:
    """Feature engineering for Nigerian transaction data"""
    
    def __init__(self):
        self.merchant_encoder = LabelEncoder()
        self.channel_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.merchant_categories = {}
        self.merchant_frequencies = {}
        
    def normalize_merchant(self, merchant: str) -> str:
        """Normalize merchant name"""
        if pd.isna(merchant):
            return "unknown"
        merchant = str(merchant).lower().strip()
        merchant = re.sub(r'[^a-z0-9\s]', '', merchant)
        merchant = re.sub(r'\s+', ' ', merchant)
        return merchant
    
    def extract_merchant_category(self, merchant: str) -> str:
        """Extract category hint from merchant name"""
        merchant_norm = self.normalize_merchant(merchant)
        for category, patterns in MERCHANT_PATTERNS.items():
            for pattern in patterns:
                if pattern in merchant_norm:
                    return category
        return "Unknown"
    
    def bin_amount(self, amount: float) -> str:
        """Bin amount into categories"""
        if amount < 1000:
            return "micro"
        elif amount < 5000:
            return "small"
        elif amount < 20000:
            return "medium"
        elif amount < 100000:
            return "large"
        else:
            return "very_large"
    
    def extract_temporal_features(self, timestamp: pd.Timestamp) -> Dict[str, Any]:
        """Extract temporal features from timestamp"""
        return {
            "day_of_week": timestamp.dayofweek,
            "hour": timestamp.hour,
            "day_of_month": timestamp.day,
            "month": timestamp.month,
            "is_weekend": 1 if timestamp.dayofweek >= 5 else 0,
            "is_month_start": 1 if timestamp.day <= 7 else 0,
            "is_month_end": 1 if timestamp.day >= 24 else 0
        }
    
    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit feature engineering and transform data"""
        print("Engineering features...")
        
        # Normalize merchants
        df['merchant_normalized'] = df['merchant'].apply(self.normalize_merchant)
        
        # Extract merchant category hints
        df['merchant_category_hint'] = df['merchant'].apply(self.extract_merchant_category)
        
        # Bin amounts
        df['amount_bin'] = df['amount'].apply(self.bin_amount)
        
        # Log transform amount
        df['amount_log'] = np.log1p(df['amount'])
        
        # Extract temporal features
        temporal_features = df['timestamp'].apply(self.extract_temporal_features)
        temporal_df = pd.DataFrame(list(temporal_features))
        df = pd.concat([df, temporal_df], axis=1)
        
        # Calculate merchant frequencies
        merchant_counts = df['merchant_normalized'].value_counts()
        self.merchant_frequencies = merchant_counts.to_dict()
        df['merchant_frequency'] = df['merchant_normalized'].map(merchant_counts)
        
        # Encode categorical variables
        df['merchant_encoded'] = self.merchant_encoder.fit_transform(df['merchant_normalized'])
        df['channel_encoded'] = self.channel_encoder.fit_transform(df['channel'].fillna('unknown'))
        df['amount_bin_encoded'] = LabelEncoder().fit_transform(df['amount_bin'])
        df['merchant_hint_encoded'] = LabelEncoder().fit_transform(df['merchant_category_hint'])
        
        # Scale numerical features
        numerical_cols = ['amount_log', 'merchant_frequency', 'day_of_week', 'hour', 'day_of_month', 'month']
        df[numerical_cols] = self.scaler.fit_transform(df[numerical_cols])
        
        return df
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform new data using fitted encoders"""
        # Normalize merchants
        df['merchant_normalized'] = df['merchant'].apply(self.normalize_merchant)
        
        # Extract merchant category hints
        df['merchant_category_hint'] = df['merchant'].apply(self.extract_merchant_category)
        
        # Bin amounts
        df['amount_bin'] = df['amount'].apply(self.bin_amount)
        
        # Log transform amount
        df['amount_log'] = np.log1p(df['amount'])
        
        # Extract temporal features
        temporal_features = df['timestamp'].apply(self.extract_temporal_features)
        temporal_df = pd.DataFrame(list(temporal_features))
        df = pd.concat([df, temporal_df], axis=1)
        
        # Map merchant frequencies (use 1 for unknown merchants)
        df['merchant_frequency'] = df['merchant_normalized'].map(self.merchant_frequencies).fillna(1)
        
        # Encode categorical variables (handle unknown categories)
        df['merchant_encoded'] = df['merchant_normalized'].apply(
            lambda x: self.merchant_encoder.transform([x])[0] if x in self.merchant_encoder.classes_ else -1
        )
        df['channel_encoded'] = df['channel'].fillna('unknown').apply(
            lambda x: self.channel_encoder.transform([x])[0] if x in self.channel_encoder.classes_ else -1
        )
        df['amount_bin_encoded'] = df['amount_bin'].apply(
            lambda x: ['micro', 'small', 'medium', 'large', 'very_large'].index(x) if x in ['micro', 'small', 'medium', 'large', 'very_large'] else 2
        )
        df['merchant_hint_encoded'] = df['merchant_category_hint'].apply(
            lambda x: list(MERCHANT_PATTERNS.keys()).index(x) if x in MERCHANT_PATTERNS else -1
        )
        
        # Scale numerical features
        numerical_cols = ['amount_log', 'merchant_frequency', 'day_of_week', 'hour', 'day_of_month', 'month']
        df[numerical_cols] = self.scaler.transform(df[numerical_cols])
        
        return df


def load_data(data_path: str) -> pd.DataFrame:
    """Load transaction data from CSV"""
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    print(f"Loaded {len(df)} transactions")
    print(f"Categories: {df['category'].nunique()}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and filter transaction data"""
    print("Cleaning data...")
    
    initial_count = len(df)
    
    # Remove transactions with missing merchant or category
    df = df.dropna(subset=['merchant', 'category'])
    
    # Remove outliers (amounts > 3 std devs from mean)
    mean_amount = df['amount'].mean()
    std_amount = df['amount'].std()
    df = df[df['amount'] <= mean_amount + 3 * std_amount]
    
    # Remove duplicates (same merchant, amount, timestamp within 24 hours)
    df = df.sort_values('timestamp')
    df['time_diff'] = df.groupby(['merchant', 'amount'])['timestamp'].diff()
    df = df[~((df['time_diff'] < pd.Timedelta(hours=24)) & (df['time_diff'] > pd.Timedelta(0)))]
    df = df.drop('time_diff', axis=1)
    
    # Filter to valid categories
    df = df[df['category'].isin(CATEGORIES)]
    
    final_count = len(df)
    print(f"Removed {initial_count - final_count} transactions ({100*(initial_count - final_count)/initial_count:.1f}%)")
    print(f"Remaining: {final_count} transactions")
    
    return df


def split_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split data into train, validation, and test sets"""
    print("Splitting data...")
    
    # First split: train+val vs test
    train_val, test = train_test_split(
        df,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=df['category']
    )
    
    # Second split: train vs val
    val_size_adjusted = VAL_SIZE / (1 - TEST_SIZE)
    train, val = train_test_split(
        train_val,
        test_size=val_size_adjusted,
        random_state=RANDOM_SEED,
        stratify=train_val['category']
    )
    
    print(f"Train: {len(train)} ({100*len(train)/len(df):.1f}%)")
    print(f"Val: {len(val)} ({100*len(val)/len(df):.1f}%)")
    print(f"Test: {len(test)} ({100*len(test)/len(df):.1f}%)")
    
    return train, val, test


def train_model(X_train: pd.DataFrame, y_train: pd.Series, X_val: pd.DataFrame, y_val: pd.Series) -> RandomForestClassifier:
    """Train Random Forest model with hyperparameter tuning"""
    print("Training Random Forest model...")
    
    # Define hyperparameter grid
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [15, 20, 25],
        'min_samples_split': [5, 10, 15],
        'class_weight': ['balanced']
    }
    
    # Initialize base model
    base_model = RandomForestClassifier(random_state=RANDOM_SEED, n_jobs=-1)
    
    # Grid search with cross-validation
    grid_search = GridSearchCV(
        base_model,
        param_grid,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED),
        scoring='f1_macro',
        n_jobs=-1,
        verbose=1
    )
    
    grid_search.fit(X_train, y_train)
    
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best CV F1 score: {grid_search.best_score_:.4f}")
    
    # Evaluate on validation set
    val_score = grid_search.score(X_val, y_val)
    print(f"Validation F1 score: {val_score:.4f}")
    
    return grid_search.best_estimator_


def evaluate_model(model: RandomForestClassifier, X: pd.DataFrame, y: pd.Series, dataset_name: str) -> Dict[str, Any]:
    """Evaluate model performance"""
    print(f"\nEvaluating on {dataset_name} set...")
    
    # Predictions
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)
    
    # Overall metrics
    accuracy = accuracy_score(y, y_pred)
    precision, recall, f1, support = precision_recall_fscore_support(y, y_pred, average='macro')
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    print(f"F1 Score: {f1:.4f}")
    
    # Per-category metrics
    print("\nPer-category metrics:")
    report = classification_report(y, y_pred, output_dict=True)
    
    failing_categories = []
    for category in CATEGORIES:
        if category in report:
            category_f1 = report[category]['f1-score']
            if category_f1 < MIN_CATEGORY_F1_THRESHOLD:
                failing_categories.append((category, category_f1))
                print(f"  {category}: F1={category_f1:.4f} ⚠️  BELOW THRESHOLD")
            else:
                print(f"  {category}: F1={category_f1:.4f}")
    
    # Confusion matrix
    cm = confusion_matrix(y, y_pred, labels=CATEGORIES)
    
    # Check thresholds
    meets_accuracy_threshold = accuracy >= MIN_ACCURACY_THRESHOLD
    meets_category_threshold = len(failing_categories) == 0
    
    if not meets_accuracy_threshold:
        print(f"\n⚠️  WARNING: Accuracy {accuracy:.4f} below threshold {MIN_ACCURACY_THRESHOLD}")
    if not meets_category_threshold:
        print(f"\n⚠️  WARNING: {len(failing_categories)} categories below F1 threshold {MIN_CATEGORY_F1_THRESHOLD}")
        for cat, f1 in failing_categories:
            print(f"    - {cat}: {f1:.4f}")
    
    if meets_accuracy_threshold and meets_category_threshold:
        print(f"\n✅ Model meets all quality thresholds!")
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'confusion_matrix': cm.tolist(),
        'classification_report': report,
        'meets_accuracy_threshold': meets_accuracy_threshold,
        'meets_category_threshold': meets_category_threshold,
        'failing_categories': failing_categories
    }


def save_model(model: RandomForestClassifier, feature_engineer: FeatureEngineer, 
               metrics: Dict[str, Any], output_dir: str) -> str:
    """Save trained model and metadata"""
    print(f"\nSaving model to {output_dir}...")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate version number
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    version = f"1.0.0_{timestamp}"
    
    # Save model
    model_path = os.path.join(output_dir, f"model_{version}.joblib")
    joblib.dump(model, model_path, compress=3)
    
    # Save feature engineer
    feature_engineer_path = os.path.join(output_dir, f"feature_engineer_{version}.joblib")
    joblib.dump(feature_engineer, feature_engineer_path, compress=3)
    
    # Calculate model hash
    with open(model_path, 'rb') as f:
        model_hash = hashlib.sha256(f.read()).hexdigest()
    
    # Save metadata
    metadata = {
        'version': version,
        'timestamp': timestamp,
        'model_path': model_path,
        'feature_engineer_path': feature_engineer_path,
        'model_hash': model_hash,
        'metrics': {
            'accuracy': metrics['accuracy'],
            'precision': metrics['precision'],
            'recall': metrics['recall'],
            'f1': metrics['f1'],
            'meets_thresholds': metrics['meets_accuracy_threshold'] and metrics['meets_category_threshold']
        },
        'hyperparameters': {
            'n_estimators': model.n_estimators,
            'max_depth': model.max_depth,
            'min_samples_split': model.min_samples_split,
            'class_weight': model.class_weight
        },
        'feature_schema': {
            'features': [
                'merchant_encoded',
                'channel_encoded',
                'amount_log',
                'amount_bin_encoded',
                'merchant_frequency',
                'merchant_hint_encoded',
                'day_of_week',
                'hour',
                'day_of_month',
                'month',
                'is_weekend',
                'is_month_start',
                'is_month_end'
            ],
            'categories': CATEGORIES
        }
    }
    
    metadata_path = os.path.join(output_dir, f"metadata_{version}.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Model saved: {model_path}")
    print(f"Feature engineer saved: {feature_engineer_path}")
    print(f"Metadata saved: {metadata_path}")
    print(f"Model hash: {model_hash}")
    print(f"Version: {version}")
    
    return version


def main():
    """Main training pipeline"""
    print("=" * 80)
    print("KOMPLEET ML Training Pipeline")
    print("Transaction Categorization Model")
    print("=" * 80)
    
    # Parse arguments
    if len(sys.argv) < 3:
        print("Usage: python train_model.py <data_path> <output_dir>")
        sys.exit(1)
    
    data_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Load and clean data
    df = load_data(data_path)
    df = clean_data(df)
    
    # Split data
    train_df, val_df, test_df = split_data(df)
    
    # Feature engineering
    feature_engineer = FeatureEngineer()
    train_df = feature_engineer.fit_transform(train_df)
    val_df = feature_engineer.transform(val_df)
    test_df = feature_engineer.transform(test_df)
    
    # Select features
    feature_cols = [
        'merchant_encoded',
        'channel_encoded',
        'amount_log',
        'amount_bin_encoded',
        'merchant_frequency',
        'merchant_hint_encoded',
        'day_of_week',
        'hour',
        'day_of_month',
        'month',
        'is_weekend',
        'is_month_start',
        'is_month_end'
    ]
    
    X_train = train_df[feature_cols].fillna(0)
    y_train = train_df['category'].fillna('Other')
    X_val = val_df[feature_cols].fillna(0)
    y_val = val_df['category'].fillna('Other')
    X_test = test_df[feature_cols].fillna(0)
    y_test = test_df['category'].fillna('Other')
    
    # Train model
    model = train_model(X_train, y_train, X_val, y_val)
    
    # Evaluate on test set
    test_metrics = evaluate_model(model, X_test, y_test, "test")
    
    # Save model
    version = save_model(model, feature_engineer, test_metrics, output_dir)
    
    print("\n" + "=" * 80)
    print("Training complete!")
    print("=" * 80)
    
    if test_metrics['meets_accuracy_threshold'] and test_metrics['meets_category_threshold']:
        print("✅ Model ready for deployment")
        sys.exit(0)
    else:
        print("⚠️  Model does not meet quality thresholds - DO NOT DEPLOY")
        sys.exit(1)


if __name__ == "__main__":
    main()
