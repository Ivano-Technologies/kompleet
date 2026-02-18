# Phase 0: UX/UI Specification & Component Design

**Date:** February 18, 2026  
**Status:** PLANNING  
**Audience:** Product, Design, Frontend Engineering

---

## 1. USER FLOWS

### Flow 1: Upload Unencrypted File (Happy Path)

```
User clicks "Upload Statement"
    ↓
Upload Entry Screen appears
    ↓
User drags PDF / clicks "Browse"
    ↓
File selected
    ↓
API detects: NOT encrypted
    ↓
Parsing begins (Progress screen)
    ↓
Success: "Found 47 transactions"
    ↓
User clicks "Review & Categorize"
    ↓
Transaction Review Screen loads
```

### Flow 2: Upload Encrypted File (With Password Prompt)

```
User clicks "Upload Statement"
    ↓
Upload Entry Screen appears
    ↓
User drags encrypted PDF / clicks "Browse"
    ↓
File selected
    ↓
API detects: ENCRYPTED
    ↓
Password Prompt Modal appears (NO re-upload required)
    ↓
User enters password
    ↓
API validates password
    ↓
IF correct:
  Parsing begins (Progress screen)
    ↓
  Success: "Found 47 transactions"
    ↓
  User clicks "Review & Categorize"
    ↓
  Transaction Review Screen loads

IF wrong:
  Error message: "That password didn't work. Try again."
    ↓
  User re-enters password (inline retry)
    ↓
  [Repeat validation]
```

### Flow 3: Upload ZIP with Multiple Files

```
User clicks "Upload Statement"
    ↓
Upload Entry Screen appears
    ↓
User drags ZIP / clicks "Browse"
    ↓
File selected
    ↓
API detects: ZIP, possibly encrypted
    ↓
IF encrypted:
  Password Prompt Modal appears
    ↓
  User enters password
    ↓
API extracts ZIP contents
    ↓
API parses each file (PDF, Excel, CSV)
    ↓
API deduplicates across files
    ↓
Success: "Found 127 transactions from 3 files"
    ↓
User clicks "Review & Categorize"
```

### Flow 4: Upload Fails (Error Handling)

```
User uploads corrupted/unsupported file
    ↓
API returns error
    ↓
Failure State appears: "We couldn't read this file"
    ↓
User sees suggestion: "Try re-exporting from your bank"
    ↓
User can:
  A) Click "Try Again" → Upload Entry Screen
  B) Click "Contact Support" → Support link
```

---

## 2. SCREEN SPECIFICATIONS

### Screen 1: Upload Entry Screen

**Purpose:** Primary CTA for bank statement upload  
**Appears:** When user navigates to /transactions/upload  
**Mobile:** Full-width, bottom-aligned button

```
┌─────────────────────────────────────────────────────┐
│ Transactions > Upload Transactions                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │  📄  Upload your bank statement               │  │
│  │                                               │  │
│  │  PDF, Excel, or CSV. Your file is processed  │  │
│  │  securely and deleted after reading.          │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  Drag and drop your file here           │  │  │
│  │  │  or click to browse                     │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Max file size: 100 MB                        │  │
│  │  Accepted formats: PDF, Excel, CSV, ZIP       │  │
│  │                                               │  │
│  │  🔒 We never store your bank statement or     │  │
│  │     password.                                 │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Drag-and-drop zone (glassmorphism effect)
- Browse button (primary CTA)
- File format hints
- Max file size indicator
- Security reassurance microcopy
- Lock icon (trust signal)

**Interactions:**
- Hover: Drag zone highlights
- Drag over: Zone becomes active
- File selected: Immediately upload (no confirmation)
- File too large: Toast error "File exceeds 100 MB"
- Unsupported format: Toast error "Only PDF, Excel, CSV, ZIP supported"

---

### Screen 2: Encryption Detected Modal

**Purpose:** Prompt user for password without re-upload  
**Appears:** Immediately after file detection (no delay)  
**Modal:** Centered, overlay, not dismissible without password or cancel

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  🔐 This file is password protected                │
│                                                     │
│  Enter the password used to open this statement.   │
│  We use it only to unlock the file and never      │
│  store it.                                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Password                                    │   │
│  │ [••••••••••••••••••••••••••••••••••••] 👁️  │   │
│  │                                             │   │
│  │ ☐ Show password                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cancel]  [Submit]                               │
│                                                     │
│  That password didn't work. Try again.             │
│  (2 attempts remaining)                            │
│                                                     │
│  ❓ Need help? → Contact support                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Lock icon (security signal)
- Title: "This file is password protected"
- Helper text: Explain password usage
- Password input field
- Show/hide password toggle
- Submit button
- Cancel button (closes modal, clears file)
- Error state (appears inline if wrong password)
- Attempt counter (2 remaining)
- Support link

**Interactions:**
- Focus on password field: Auto-focus on modal open
- Type password: No character count visible
- Show/hide toggle: Reveals/masks password
- Submit: Validate password, show spinner
- Wrong password: Error message + attempt counter
- 3 failed attempts: Lock modal, show "Contact support"
- Cancel: Close modal, return to upload screen

---

### Screen 3: Upload Progress State

**Purpose:** Show parsing and processing steps  
**Appears:** After file upload begins  
**Duration:** 2-30 seconds depending on file size

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Uploading your statement...                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   │
│  │ 45%                                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ✓ Uploading file                                  │
│  ⊙ Unlocking statement                             │
│  ○ Reading transactions                            │
│  ○ Preparing your data                             │
│                                                     │
│  [Cancel]                                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Steps:**
1. Uploading file (0-20%)
2. Unlocking statement (20-40%) [only if encrypted]
3. Reading transactions (40-80%)
4. Preparing your data (80-100%)

**Components:**
- Progress bar (smooth animation)
- Percentage indicator
- Step list with icons:
  - ✓ (completed)
  - ⊙ (in progress, spinner)
  - ○ (pending)
- Cancel button
- Estimated time remaining (optional)

**Interactions:**
- Auto-advance steps as backend processes
- Cancel: Stop upload, return to upload screen
- Timeout (>30s): Show "Taking longer than expected" message

---

### Screen 4: Success State

**Purpose:** Confirm successful parsing  
**Appears:** After parsing completes  
**Duration:** User-triggered next action

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ✅ Statement imported successfully                │
│                                                     │
│  We found 47 transactions.                         │
│                                                     │
│  📊 Summary:                                        │
│  • Date range: Feb 1 - Feb 18, 2026                │
│  • Total debit: ₦2,450,000                         │
│  • Total credit: ₦3,100,000                        │
│  • Net: +₦650,000                                  │
│                                                     │
│  [Review and categorize transactions]              │
│                                                     │
│  or                                                │
│                                                     │
│  [Upload another statement]                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Success checkmark (animated)
- Transaction count
- Summary statistics (optional)
- Primary CTA: "Review and categorize transactions"
- Secondary CTA: "Upload another statement"

**Interactions:**
- Primary CTA: Navigate to /transactions/review
- Secondary CTA: Return to upload screen

---

### Screen 5: Failure State

**Purpose:** Graceful error handling  
**Appears:** When parsing fails  
**Duration:** User-triggered retry or support contact

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ❌ We couldn't read this file                     │
│                                                     │
│  The file may be:                                  │
│  • Corrupted or damaged                            │
│  • In an unsupported format                        │
│  • Missing required data                           │
│                                                     │
│  What you can try:                                 │
│  1. Re-export the statement from your bank         │
│  2. Try a different file format (CSV instead of    │
│     PDF)                                           │
│  3. Check that the file is not corrupted           │
│                                                     │
│  [Try Again]  [Contact Support]                    │
│                                                     │
│  Error details (for support):                      │
│  Error: PARSING_ERROR                              │
│  File: OpTransactionHistoryUX517-02-2026.pdf       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Components:**
- Error icon (animated)
- Error title
- Possible causes (bullet list)
- Troubleshooting steps
- Primary CTA: "Try Again"
- Secondary CTA: "Contact Support"
- Error details (for debugging)

**Interactions:**
- Try Again: Return to upload screen
- Contact Support: Open support form with error details pre-filled

---

## 3. COMPONENT SPECIFICATIONS

### Component: UploadWidget.tsx

**Props:**
```typescript
interface UploadWidgetProps {
  onSuccess?: (transactionCount: number) => void;
  onError?: (error: string) => void;
  maxFileSize?: number; // bytes, default 100MB
  acceptedFormats?: string[]; // default ['pdf', 'xlsx', 'xls', 'csv', 'zip']
}
```

**State:**
```typescript
enum UploadState {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PARSING = 'parsing',
  SUCCESS = 'success',
  ERROR = 'error',
  PASSWORD_REQUIRED = 'password_required',
}

interface UploadWidgetState {
  state: UploadState;
  file?: File;
  progress: number; // 0-100
  transactionCount?: number;
  error?: string;
  requiresPassword: boolean;
  passwordAttempts: number;
}
```

**Behavior:**
- Drag-and-drop file selection
- File validation (size, format)
- Upload to /api/ingest
- Handle password requirement
- Show progress states
- Handle success/error states

---

### Component: PasswordPrompt.tsx

**Props:**
```typescript
interface PasswordPromptProps {
  fileName: string;
  onSubmit: (password: string) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  attemptsRemaining: number;
  isLoading: boolean;
  error?: string;
}
```

**Behavior:**
- Auto-focus on password field
- Show/hide password toggle
- Submit on Enter key
- Disable submit if no password
- Show error inline
- Track attempt counter
- Lock after 3 failed attempts

---

### Component: UploadStatus.tsx

**Props:**
```typescript
interface UploadStatusProps {
  progress: number; // 0-100
  currentStep: 'uploading' | 'unlocking' | 'reading' | 'preparing';
  onCancel: () => void;
  estimatedTimeRemaining?: number; // seconds
}
```

**Behavior:**
- Smooth progress bar animation
- Step indicator with icons
- Cancel button
- Optional time estimate

---

## 4. MOBILE CONSIDERATIONS

### Responsive Breakpoints

**Mobile (< 640px):**
- Full-width upload zone
- Larger touch targets (min 44px)
- Modal takes full screen (with padding)
- Simplified progress display
- Stacked buttons

**Tablet (640px - 1024px):**
- 80% width, centered
- Same components as desktop
- Slightly larger touch targets

**Desktop (> 1024px):**
- 600px max-width, centered
- Standard touch targets
- Side-by-side buttons

### Mobile-Specific Interactions

- **File Picker:** Use native file picker (supports camera import on iOS)
- **Keyboard:** Show password keyboard on password field
- **Orientation:** Handle portrait/landscape rotation
- **Connectivity:** Show offline state if applicable

---

## 5. ACCESSIBILITY REQUIREMENTS

### WCAG 2.1 Level AA Compliance

- **Color Contrast:** All text meets 4.5:1 ratio
- **Focus Indicators:** Visible focus ring on all interactive elements
- **Keyboard Navigation:** All flows work with keyboard only
- **Screen Readers:** Proper ARIA labels and roles
- **Error Messages:** Clear, specific, actionable
- **Form Labels:** Associated with inputs

### Specific Implementations

```tsx
// Password input with label
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-label="Enter password to unlock file"
  aria-required="true"
/>

// Error message with live region
<div role="alert" aria-live="polite">
  That password didn't work. Try again.
</div>

// Progress indicator
<div role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}>
  45% complete
</div>
```

---

## 6. MICROCOPY & MESSAGING

### Tone
- **Friendly:** Avoid technical jargon
- **Reassuring:** Emphasize security and privacy
- **Clear:** Specific, actionable guidance
- **Concise:** Short sentences, scannable

### Key Messages

| Scenario | Message |
|----------|---------|
| **Upload entry** | "PDF, Excel, or CSV. Your file is processed securely and deleted after reading." |
| **Security note** | "🔒 We never store your bank statement or password." |
| **Password prompt** | "Enter the password used to open this statement. We use it only to unlock the file and never store it." |
| **Wrong password** | "That password didn't work. Try again." |
| **Success** | "Statement imported successfully. We found {{count}} transactions." |
| **Error** | "We couldn't read this file. Try re-exporting the statement from your bank or upload a different format." |
| **Support link** | "Need help? Contact support." |

---

## 7. DESIGN TOKENS

### Colors
- **Primary:** #1B5E3F (Kompleet green)
- **Success:** #22C55E (Green)
- **Error:** #EF4444 (Red)
- **Warning:** #F59E0B (Amber)
- **Neutral:** #6B7280 (Gray)
- **Background:** #FFFFFF (Light) / #1F2937 (Dark)

### Typography
- **Headline:** 24px, bold, color-primary
- **Subheading:** 16px, medium, color-neutral
- **Body:** 14px, regular, color-neutral
- **Caption:** 12px, regular, color-neutral-light

### Spacing
- **Padding:** 16px, 24px, 32px
- **Gap:** 12px, 16px, 24px
- **Border radius:** 8px, 12px, 16px

### Effects
- **Glassmorphism:** backdrop-filter: blur(10px), opacity 0.8
- **Shadow:** 0 4px 12px rgba(0, 0, 0, 0.1)
- **Transition:** 200ms ease-in-out

---

**Document Status:** READY FOR REVIEW  
**Prepared by:** Manus AI  
**Date:** February 18, 2026
