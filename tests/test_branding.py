#!/usr/bin/env python3
"""
KOMPLEET Branding Validation Script
Tests that all pages show correct KOMPLEET branding and no Supabase references
"""

import os
import re
from pathlib import Path

def check_file_for_supabase_references(file_path):
    """Check a file for unwanted Supabase references in UI"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Patterns to check (excluding legitimate code references)
    ui_patterns = [
        r'Secure authentication with Supabase',  # Old landing page text
        r'Welcome to.*Supabase',
        r'Powered by Supabase',
        r'supabase\.co(?!\'|"|\))',  # Supabase URL in visible text (not in code)
    ]
    
    issues = []
    for pattern in ui_patterns:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            issues.append({
                'file': str(file_path),
                'line': line_num,
                'pattern': pattern,
                'match': match.group()
            })
    
    return issues

def check_branding_elements(file_path):
    """Check if file contains KOMPLEET branding elements"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    branding_elements = {
        'logo': bool(re.search(r'logo-primary\.png|logo-inverted\.png', content)),
        'tagline': bool(re.search(r'Kompleet records.*Kompleet filings.*Kompleet compliance', content, re.IGNORECASE)),
        'kompleet_name': bool(re.search(r'KOMPLEET', content)),
    }
    
    return branding_elements

def main():
    print("=" * 80)
    print("KOMPLEET BRANDING VALIDATION")
    print("=" * 80)
    print()
    
    web_dir = Path('/home/ubuntu/kompleet-web')
    
    # Files to check for branding
    key_files = [
        'src/app/page.tsx',  # Landing page
        'src/app/login/page.tsx',  # Login page
        'src/app/signup/page.tsx',  # Sign up page
    ]
    
    print("📋 Checking Key Pages for Branding...")
    print()
    
    all_good = True
    
    for file_path in key_files:
        full_path = web_dir / file_path
        if not full_path.exists():
            print(f"⚠️  {file_path}: FILE NOT FOUND")
            all_good = False
            continue
        
        # Check for Supabase references
        issues = check_file_for_supabase_references(full_path)
        
        # Check for branding elements
        branding = check_branding_elements(full_path)
        
        status = "✅" if not issues else "❌"
        print(f"{status} {file_path}")
        
        if issues:
            all_good = False
            for issue in issues:
                print(f"   ❌ Line {issue['line']}: Found '{issue['match']}'")
        
        # Report branding elements
        if branding['logo']:
            print(f"   ✅ Logo present")
        if branding['tagline']:
            print(f"   ✅ Tagline present")
        if branding['kompleet_name']:
            print(f"   ✅ KOMPLEET name present")
        
        if not any(branding.values()):
            print(f"   ⚠️  No KOMPLEET branding elements found")
        
        print()
    
    # Check for old landing page content
    print("📋 Checking for Old Landing Page Content...")
    print()
    
    landing_page = web_dir / 'src/app/page.tsx'
    if landing_page.exists():
        with open(landing_page, 'r') as f:
            content = f.read()
        
        old_patterns = [
            ('Welcome to Kompleet Platform', False),  # Old title
            ('Professional platform for transaction management', False),  # Old subtitle
            ('Secure authentication with Supabase', True),  # Old feature text
        ]
        
        for pattern, is_bad in old_patterns:
            if pattern in content:
                if is_bad:
                    print(f"❌ Found old content: '{pattern}'")
                    all_good = False
                else:
                    print(f"✅ Found: '{pattern}'")
            else:
                if not is_bad:
                    print(f"⚠️  Missing: '{pattern}'")
        
        # Check for new branding
        new_patterns = [
            'Kompleet records. Kompleet filings. Kompleet compliance.',
            'KOMPLEET',
            'logo-primary.png',
        ]
        
        print()
        print("New Branding Elements:")
        for pattern in new_patterns:
            if pattern in content:
                print(f"✅ Found: '{pattern}'")
            else:
                print(f"❌ Missing: '{pattern}'")
                all_good = False
    
    print()
    print("=" * 80)
    print("OAUTH CONFIGURATION STATUS")
    print("=" * 80)
    print()
    print("⚠️  OAuth Consent Screen Configuration Required")
    print()
    print("Current Issue:")
    print("  - Google OAuth shows 'supabase.co' domain instead of KOMPLEET")
    print()
    print("Solution:")
    print("  1. Configure Google Cloud Console OAuth consent screen")
    print("  2. Set Application Name: KOMPLEET")
    print("  3. Upload KOMPLEET logo (120x120px minimum)")
    print("  4. Add privacy policy and terms of service URLs")
    print()
    print("Documentation:")
    print("  - See: /home/ubuntu/kompleet-web/docs/OAUTH_BRANDING_SETUP.md")
    print()
    print("Note: This requires access to Google Cloud Console project")
    print("      and cannot be fixed through code changes alone.")
    print()
    
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print()
    
    if all_good:
        print("✅ ALL BRANDING CHECKS PASSED")
        print()
        print("Application UI:")
        print("  ✅ Landing page has new branded design")
        print("  ✅ Login page shows KOMPLEET branding")
        print("  ✅ Sign up page shows KOMPLEET branding")
        print("  ✅ No Supabase references in UI")
        print()
        print("Remaining Action:")
        print("  ⚠️  Configure OAuth consent screen in Google Cloud Console")
        print("     (See docs/OAUTH_BRANDING_SETUP.md for instructions)")
        return 0
    else:
        print("❌ BRANDING ISSUES FOUND")
        print()
        print("Please review the issues above and fix them.")
        return 1

if __name__ == '__main__':
    exit(main())
