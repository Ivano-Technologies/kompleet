#!/usr/bin/env python3
"""
Generate synthetic Nigerian transaction dataset for ML training
This creates realistic transaction data with Nigerian merchants, amounts, and patterns
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Nigerian merchants by category
NIGERIAN_MERCHANTS = {
    "Groceries": [
        "Shoprite Lagos", "Spar Ikeja", "Game Lekki", "Ebeano Supermarket",
        "Grand Square", "Park n Shop", "Justrite", "Next Cash and Carry",
        "Market Square", "Addide Supermarket", "Hubmart", "Prince Ebeano"
    ],
    "Food & Dining": [
        "KFC Victoria Island", "Dominos Pizza Lekki", "Chicken Republic",
        "Sweet Sensation", "Mama Cass", "Yellow Chilli", "Bukka Hut",
        "The Place Lekki", "Kilimanjaro", "Jevinik", "Bungalow Restaurant",
        "Iya Oyo Amala", "Mr Biggs", "Tantalizers", "Mama Put Yaba"
    ],
    "Transportation": [
        "Uber Nigeria", "Bolt Lagos", "Lagos Ride", "Oando Fuel Station",
        "Total Petrol", "Mobil Filling Station", "Conoil", "NNPC Mega Station",
        "Forte Oil", "Rain Oil", "ABC Transport", "GUO Transport"
    ],
    "Utilities": [
        "EKEDC", "IKEDC", "AEDC", "PHEDC", "DSTV Nigeria", "GOTV",
        "Startimes", "MTN Nigeria", "GLO", "Airtel", "9mobile",
        "Spectranet", "Smile Telecoms", "Swift Networks"
    ],
    "Healthcare": [
        "Lagoon Hospital", "Reddington Hospital", "St Nicholas Hospital",
        "Medplus Pharmacy", "HealthPlus", "Alpha Pharmacy", "Drugfield Pharmacy",
        "Cedarcrest Hospital", "Eko Hospital", "Gold Cross Pharmacy"
    ],
    "Education": [
        "University of Lagos", "Covenant University", "Pan Atlantic University",
        "British International School", "Corona Schools", "Greensprings School",
        "Chrisland Schools", "Grange School", "Lekki British School"
    ],
    "Entertainment": [
        "Filmhouse Cinema", "Genesis Deluxe Cinema", "Silverbird Cinemas",
        "Netflix Nigeria", "Spotify Premium", "DSTV Premium", "Showmax",
        "Terra Kulture", "Freedom Park Lagos", "Nike Art Gallery"
    ],
    "Shopping": [
        "Jumia Nigeria", "Konga Online", "Slot Nigeria", "Computer Village",
        "Balogun Market", "Lekki Market", "Yaba Market", "Palms Shopping Mall",
        "Ikeja City Mall", "Jara Mall", "Adeniran Ogunsanya Mall"
    ],
    "Personal Care": [
        "Poise Salon", "Nail Studio Lagos", "Spa Euphoria", "Radiance Beauty Lounge",
        "Essenza Wellness Spa", "Barbers Corner", "Grooming by Ayo", "Beauty First"
    ],
    "Home & Garden": [
        "Leventis Furniture", "Decorum Furniture", "Home Affairs", "Shoprite Home",
        "Ozone Cinemas Furniture", "Mega Plaza", "Yaba Furniture Market"
    ],
    "Travel": [
        "Eko Hotel", "Transcorp Hilton", "Radisson Blu", "Sheraton Lagos",
        "Air Peace", "Arik Air", "Dana Air", "Aero Contractors",
        "Wakanow", "Travelstart Nigeria", "Jumia Travel"
    ],
    "Insurance": [
        "AXA Mansard", "AIICO Insurance", "Leadway Assurance", "Custodian Insurance",
        "Cornerstone Insurance", "Sovereign Trust Insurance", "Consolidated Hallmark"
    ],
    "Investments": [
        "Stanbic IBTC", "ARM Investment", "Chapel Hill Denham", "Meristem",
        "Cowry Asset Management", "FBN Quest", "Vetiva Capital"
    ],
    "Rent": [
        "Estate Agent Lagos", "Property Mart", "Landlord Payment", "Rent Collection",
        "Housing Association", "Estate Management"
    ],
    "Salary": [
        "Employer Payroll", "Company Salary", "Monthly Wage", "Salary Transfer"
    ],
    "Business": [
        "Vendor Payment", "Supplier Invoice", "Business Expense", "Office Supplies",
        "Professional Services", "Consulting Fee", "Contract Payment"
    ],
    "Gifts & Donations": [
        "Church Offering", "Mosque Donation", "Charity Contribution", "Gift Purchase",
        "Wedding Gift", "Birthday Present", "Family Support"
    ],
    "Taxes": [
        "NRS Tax Payment", "Tax Payment", "VAT Payment", "Company Tax",
        "Personal Income Tax", "Property Tax"
    ],
    "Other": [
        "Miscellaneous", "General Expense", "Unclassified", "Various"
    ]
}

# Payment channels in Nigeria
CHANNELS = ["card", "transfer", "cash", "mobile", "pos", "ussd"]

# Amount ranges by category (in Naira)
AMOUNT_RANGES = {
    "Groceries": (2000, 50000),
    "Food & Dining": (1000, 30000),
    "Transportation": (500, 15000),
    "Utilities": (2000, 25000),
    "Healthcare": (5000, 100000),
    "Education": (50000, 500000),
    "Entertainment": (2000, 20000),
    "Shopping": (3000, 100000),
    "Personal Care": (2000, 30000),
    "Home & Garden": (10000, 200000),
    "Travel": (20000, 300000),
    "Insurance": (10000, 100000),
    "Investments": (50000, 1000000),
    "Rent": (100000, 2000000),
    "Salary": (100000, 1000000),
    "Business": (10000, 500000),
    "Gifts & Donations": (1000, 50000),
    "Taxes": (10000, 200000),
    "Other": (1000, 50000)
}

# Frequency patterns (transactions per month)
FREQUENCY_PATTERNS = {
    "Groceries": (4, 12),  # Weekly to multiple times per week
    "Food & Dining": (5, 20),  # Very frequent
    "Transportation": (10, 40),  # Daily commute
    "Utilities": (1, 2),  # Monthly bills
    "Healthcare": (0.5, 2),  # Occasional
    "Education": (0.25, 1),  # Quarterly to annual
    "Entertainment": (2, 8),  # Few times per month
    "Shopping": (2, 10),  # Regular
    "Personal Care": (1, 4),  # Monthly
    "Home & Garden": (0.5, 2),  # Occasional
    "Travel": (0.25, 1),  # Occasional
    "Insurance": (0.25, 1),  # Quarterly to annual
    "Investments": (1, 4),  # Monthly
    "Rent": (1, 1),  # Monthly
    "Salary": (1, 2),  # Monthly
    "Business": (5, 20),  # Frequent
    "Gifts & Donations": (1, 4),  # Occasional
    "Taxes": (0.25, 1),  # Quarterly to annual
    "Other": (1, 5)  # Variable
}


def generate_transactions(num_users: int = 500, months: int = 12, target_total: int = 50000):
    """Generate synthetic transaction dataset"""
    
    print(f"Generating dataset for {num_users} users over {months} months...")
    print(f"Target: ~{target_total} transactions")
    
    transactions = []
    start_date = datetime.now() - timedelta(days=months * 30)
    
    for user_id in range(1, num_users + 1):
        if user_id % 50 == 0:
            print(f"  Processing user {user_id}/{num_users}...")
        
        # Generate user-specific patterns
        user_categories = random.sample(list(NIGERIAN_MERCHANTS.keys()), k=random.randint(8, 15))
        
        for category in user_categories:
            merchants = NIGERIAN_MERCHANTS[category]
            user_merchants = random.sample(merchants, k=min(len(merchants), random.randint(1, 3)))
            
            # Determine frequency for this category
            min_freq, max_freq = FREQUENCY_PATTERNS[category]
            freq_per_month = random.uniform(min_freq, max_freq)
            total_transactions = int(freq_per_month * months)
            
            for _ in range(total_transactions):
                merchant = random.choice(user_merchants)
                
                # Generate amount within category range
                min_amount, max_amount = AMOUNT_RANGES[category]
                
                # Add some variation - 80% within range, 20% outliers
                if random.random() < 0.8:
                    amount = random.uniform(min_amount, max_amount)
                else:
                    amount = random.uniform(min_amount * 0.5, max_amount * 1.5)
                
                # Round to nearest 50 Naira
                amount = round(amount / 50) * 50
                
                # Generate timestamp
                days_offset = random.randint(0, months * 30)
                timestamp = start_date + timedelta(days=days_offset)
                
                # Add time of day patterns
                if category in ["Food & Dining"]:
                    # Lunch and dinner times
                    hour = random.choice([12, 13, 14, 18, 19, 20, 21])
                elif category in ["Transportation"]:
                    # Morning and evening commute
                    hour = random.choice([7, 8, 9, 17, 18, 19])
                elif category in ["Entertainment"]:
                    # Evening and weekends
                    hour = random.choice([18, 19, 20, 21, 22])
                else:
                    # Business hours
                    hour = random.randint(9, 18)
                
                timestamp = timestamp.replace(hour=hour, minute=random.randint(0, 59))
                
                # Select payment channel
                if category in ["Utilities", "Insurance", "Rent"]:
                    channel = random.choice(["transfer", "card"])
                elif category in ["Transportation", "Food & Dining"]:
                    channel = random.choice(["cash", "card", "pos", "mobile"])
                else:
                    channel = random.choice(CHANNELS)
                
                transactions.append({
                    "user_id": f"user_{user_id}",
                    "merchant": merchant,
                    "amount": amount,
                    "category": category,
                    "channel": channel,
                    "timestamp": timestamp.isoformat()
                })
    
    # Create DataFrame
    df = pd.DataFrame(transactions)
    
    # Sort by timestamp
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Add some noise - 5% mislabeled categories (to simulate real-world data quality issues)
    noise_indices = random.sample(range(len(df)), k=int(len(df) * 0.05))
    for idx in noise_indices:
        df.at[idx, 'category'] = random.choice(list(NIGERIAN_MERCHANTS.keys()))
    
    print(f"\nGenerated {len(df)} transactions")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Categories: {df['category'].nunique()}")
    print(f"Unique merchants: {df['merchant'].nunique()}")
    print(f"Users: {df['user_id'].nunique()}")
    
    print("\nCategory distribution:")
    print(df['category'].value_counts())
    
    print("\nChannel distribution:")
    print(df['channel'].value_counts())
    
    print("\nAmount statistics:")
    print(df['amount'].describe())
    
    return df


def main():
    """Generate and save dataset"""
    print("=" * 80)
    print("KOMPLEET ML Training Dataset Generator")
    print("Nigerian Transaction Data")
    print("=" * 80)
    
    # Generate dataset
    df = generate_transactions(num_users=500, months=12, target_total=50000)
    
    # Save to CSV
    output_path = "nigerian_transactions_training.csv"
    df.to_csv(output_path, index=False)
    print(f"\n✅ Dataset saved to: {output_path}")
    
    print("\n" + "=" * 80)
    print("Dataset generation complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()
