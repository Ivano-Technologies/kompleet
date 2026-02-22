# Phase 3 Feature Roadmap

**Timeline**: Months 3-6 (Post-MVP)
**Focus**: Advanced Features & AI Capabilities
**Goal**: Transform KOMPLEET from calculator tool to complete tax compliance platform

---

## Feature Overview

| Feature ID | Name                     | Priority | Effort | Dependencies                  |
| ---------- | ------------------------ | -------- | ------ | ----------------------------- |
| F-08       | Tax Advisory Chatbot     | P0       | 40h    | OpenAI API, Vector DB         |
| F-09       | Tax Calendar & Reminders | P0       | 30h    | Email service, Cron jobs      |
| F-10       | Tax Savings Optimizer    | P1       | 50h    | ML models, Historical data    |
| F-11       | Multi-User Collaboration | P1       | 35h    | Real-time sync, Permissions   |
| F-12       | Advanced Reporting       | P2       | 25h    | Chart library, Export service |

**Total Estimated Effort**: 180 hours (~2.5 months with 1 FTE)

---

## F-08: Tax Advisory Chatbot

### Overview

AI-powered chatbot that answers Nigerian tax questions, provides compliance guidance, and helps users understand complex tax regulations.

### User Stories

1. As a business owner, I want to ask "What tax forms do I need to file?" and get personalized answers
2. As an individual, I want to ask "Can I deduct home office expenses?" and get accurate Nigerian tax guidance
3. As a user, I want the chatbot to reference specific sections of the Tax Act

### Technical Specification

**Architecture:**

```
User Question
    ↓
Next.js API Route (/api/chat)
    ↓
OpenAI GPT-4 + RAG (Retrieval Augmented Generation)
    ↓
Vector Database (Pinecone/Supabase pgvector)
    ├── Nigerian Tax Act 2026 (embedded)
    ├── FIRS Guidelines (embedded)
    └── KOMPLEET Knowledge Base (embedded)
    ↓
Contextual Response
```

**Database Schema:**

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id),
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 embeddings
  source TEXT, -- 'tax_act', 'firs_guideline', 'faq'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
```

**Implementation Steps:**

1. **Setup Vector Database** (4h)
   - Install pgvector extension in Supabase
   - Create knowledge_base table
   - Implement embedding pipeline

2. **Ingest Tax Knowledge** (8h)
   - Extract text from Nigerian Tax Act 2026 PDF
   - Chunk into 500-token segments
   - Generate embeddings using OpenAI `text-embedding-ada-002`
   - Store in knowledge_base table

3. **Build Chat API** (12h)
   - Create `/api/chat/route.ts`
   - Implement RAG pipeline:
     - User question → Generate embedding
     - Search knowledge_base for top 5 similar chunks
     - Construct prompt with context
     - Call OpenAI GPT-4
     - Stream response
   - Add conversation persistence

4. **Build Chat UI** (12h)
   - Create `/chatbot` page
   - Implement chat interface (messages, input, send)
   - Add streaming response support
   - Show source citations
   - Conversation history sidebar

5. **Testing & Refinement** (4h)
   - Test accuracy with 50 common tax questions
   - Refine prompts for Nigerian context
   - Add safety guardrails (don't give legal advice disclaimer)

**API Example:**

```typescript
// POST /api/chat
{
  "conversationId": "uuid-or-null",
  "message": "What is the CIT rate for small companies?"
}

// Response (streaming)
{
  "role": "assistant",
  "content": "In Nigeria, small companies are exempt from Company Income Tax (0% rate). A company qualifies as 'small' if it meets these criteria:\n\n1. Annual turnover ≤ ₦50,000,000\n2. Total assets ≤ ₦100,000,000\n\nSource: Nigerian Tax Act 2026, Section 42(1)",
  "sources": [
    {
      "title": "Tax Act 2026 - Section 42",
      "snippet": "...",
      "confidence": 0.94
    }
  ]
}
```

**Cost Estimate:**

- OpenAI API: ~$50-100/month (1000 conversations)
- Vector DB: Included with Supabase Pro

---

## F-09: Tax Calendar & Reminders

### Overview

Automated tax deadline tracking with email/SMS reminders for upcoming filing deadlines, payment due dates, and compliance events.

### User Stories

1. As a business owner, I want automatic reminders 7 days before CIT filing deadline
2. As an individual, I want to see all my tax deadlines in a calendar view
3. As a user, I want to customize when I receive reminder notifications

### Technical Specification

**Database Schema:**

```sql
CREATE TABLE tax_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tax_type TEXT NOT NULL, -- 'pit', 'cit', 'vat', 'wht'
  deadline_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- RRULE format
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'overdue'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reminder_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  days_before JSONB DEFAULT '[7, 3, 1]', -- Days before to send reminders
  time_of_day TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'Africa/Lagos'
);

CREATE TABLE sent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deadline_id UUID NOT NULL REFERENCES tax_deadlines(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT NOT NULL, -- 'email', 'sms', 'push'
  status TEXT DEFAULT 'delivered' -- 'delivered', 'bounced', 'failed'
);
```

**Implementation Steps:**

1. **Deadline Management** (8h)
   - Create `/api/deadlines` CRUD endpoints
   - Auto-generate standard deadlines (CIT: March 31, VAT: Quarterly, etc.)
   - Support custom user deadlines
   - Recurring deadline logic (RRULE parsing)

2. **Calendar UI** (10h)
   - Create `/calendar` page
   - Implement calendar view (react-big-calendar)
   - Color-code by tax type
   - Click to view deadline details
   - Mark as completed

3. **Email Reminders** (8h)
   - Set up Resend/SendGrid for transactional emails
   - Create email templates (7-day, 3-day, 1-day)
   - Implement cron job (Vercel Cron or Inngest)
   - Check deadlines daily at 9 AM WAT
   - Send emails based on user preferences

4. **SMS Reminders** (Optional - 4h)
   - Integrate Twilio for SMS
   - Keep messages under 160 characters
   - Only for users who enable SMS

5. **Testing** (2h)
   - Test email delivery
   - Test recurring deadlines
   - Verify timezone handling

**Cron Configuration** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/check-deadlines",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Email Template Example:**

```
Subject: Reminder: CIT Filing Deadline in 7 Days

Hi [Name],

This is a friendly reminder that your Company Income Tax (CIT) filing deadline is approaching:

📅 Deadline: March 31, 2026 (7 days from now)
📋 Tax Type: Company Income Tax
💰 Estimated Tax: ₦2,500,000

What to do next:
1. Review your saved CIT calculation
2. Gather required documents
3. File via FIRS online portal

[View Details] [Mark as Completed]

Best,
The KOMPLEET Team
```

---

## F-10: Tax Savings Optimizer

### Overview

AI-powered analysis that identifies tax-saving opportunities based on user's financial profile and Nigerian tax laws.

### User Stories

1. As a business owner, I want to see what deductions I'm missing
2. As an individual, I want recommendations to reduce my tax burden legally
3. As a user, I want personalized tax planning advice

### Technical Specification

**Optimization Rules Engine:**

```typescript
interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  applicableTo: "individual" | "business" | "both";
  category: "deduction" | "credit" | "timing" | "structure";
  potentialSavings: (profile: UserProfile) => number;
  recommendation: string;
  implementation: string[];
}

const optimizationRules: OptimizationRule[] = [
  {
    id: "pension_contribution",
    name: "Maximize Pension Contributions",
    applicableTo: "both",
    category: "deduction",
    potentialSavings: (profile) => {
      const currentPension = profile.pensionContribution;
      const maxPension = profile.grossIncome * 0.2; // 20% limit
      const additionalContribution = maxPension - currentPension;
      return additionalContribution * profile.marginalTaxRate;
    },
    recommendation: "Increase pension contribution to maximize tax relief",
    implementation: [
      "Contact your pension administrator",
      "Increase monthly contribution",
      "Claim relief on tax return",
    ],
  },
  // ... 20+ more rules
];
```

**Implementation Steps:**

1. **Rules Engine** (16h)
   - Define 20+ optimization rules
   - Implement rule matching logic
   - Calculate potential savings
   - Prioritize by impact

2. **Analysis API** (8h)
   - Create `/api/optimize` endpoint
   - Analyze user's profile + transaction history
   - Run all applicable rules
   - Return ranked recommendations

3. **Optimizer UI** (12h)
   - Create `/optimizer` page
   - Show current tax situation
   - Display recommendations (cards)
   - Show potential savings per recommendation
   - Implementation steps

4. **Scenario Modeling** (10h)
   - "What-if" calculator
   - Adjust income/deductions
   - See impact on tax liability
   - Compare scenarios side-by-side

5. **Testing** (4h)
   - Test with 10 different user profiles
   - Verify calculations accuracy
   - Validate legal compliance

**UI Mockup:**

```
┌─────────────────────────────────────────┐
│ Tax Savings Opportunities               │
├─────────────────────────────────────────┤
│ Based on your 2026 tax profile, we     │
│ found 5 opportunities to save ₦850K    │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ 💰 Maximize Pension Contributions  │ │
│ │ Potential Savings: ₦320,000        │ │
│ │                                    │ │
│ │ You're contributing 8% to pension. │ │
│ │ Increase to 20% limit for maximum  │ │
│ │ tax relief.                        │ │
│ │                                    │ │
│ │ [See How to Implement]  [Dismiss]  │ │
│ └────────────────────────────────────┘ │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ 🏠 Claim Rent Relief               │ │
│ │ Potential Savings: ₦105,000        │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Implementation Priority

### Month 1: Foundation

- **Week 1-2**: F-09 Email reminders (basic)
- **Week 3-4**: F-08 Chatbot (MVP with basic RAG)

### Month 2: Enhancement

- **Week 1-2**: F-08 Chatbot refinement + sources
- **Week 3-4**: F-09 Calendar UI + recurring deadlines

### Month 3: Advanced

- **Week 1-3**: F-10 Tax Optimizer (rules engine + UI)
- **Week 4**: Testing & polish

---

## Success Metrics

| Feature        | Metric                       | Target  |
| -------------- | ---------------------------- | ------- |
| F-08 Chatbot   | Accuracy (user satisfaction) | > 85%   |
| F-08 Chatbot   | Response time                | < 3s    |
| F-09 Reminders | Email delivery rate          | > 95%   |
| F-09 Reminders | User engagement (click rate) | > 40%   |
| F-10 Optimizer | Recommendations accepted     | > 30%   |
| F-10 Optimizer | Avg savings identified       | > ₦500K |

---

## Technical Dependencies

### Required Services

- **OpenAI API** ($100-200/month) - GPT-4 + embeddings
- **Email Service** (Resend/SendGrid) ($10-30/month)
- **Cron Jobs** (Vercel Cron - included, or Inngest free tier)
- **Vector DB** (Supabase pgvector - included)

### Optional Services

- **SMS** (Twilio) - Pay per message (~₦50/SMS)
- **Push Notifications** (Firebase Cloud Messaging - free)

---

## Risks & Mitigation

| Risk                            | Impact | Mitigation                                             |
| ------------------------------- | ------ | ------------------------------------------------------ |
| Chatbot gives wrong tax advice  | High   | Add disclaimers, cite sources, human review            |
| Email deliverability issues     | Medium | Use reputable ESP, verify domain, monitor bounce rates |
| Optimizer rules become outdated | Medium | Quarterly review, version control rules                |
| OpenAI API costs exceed budget  | Low    | Cache responses, use GPT-3.5 for simple queries        |

---

**Last Updated**: February 11, 2026
**Owner**: Product & Engineering Team
**Next Review**: Post-MVP Launch + 30 days
