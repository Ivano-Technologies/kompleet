# Sprint 1: Foundations & Infrastructure

**Duration**: Week 1 (Feb 4-11, 2026)
**Status**: 🟢 In Progress

## Objectives

Establish the foundational infrastructure for Nigerian Tax features, including versioned tax rules engine, regulatory monitoring skeleton, audit logging, and mobile app scaffolding.

## Deliverables

### 1. Versioned Tax Rules Engine ✅

**Owner**: Engineering Lead
**Priority**: P0 (Critical)

**Tasks**:

- [x] Create database schema for `tax_rules`, `rule_versions`, `sources`
- [ ] Implement Rules Engine service (`src/server/tax/rules-engine.ts`)
- [ ] Create API endpoints for querying rules by version
- [ ] Add unit tests for rules engine

**Acceptance Criteria**:

- Tax rules can be versioned with timestamps
- Rules can be queried by version ID or "latest"
- Each rule links to a source with last-reviewed date
- Rollback capability for rule versions

### 2. Regulatory Source Ingestion Skeleton ✅

**Owner**: Engineering Lead
**Priority**: P1 (High)

**Tasks**:

- [ ] Create `sources` table in database
- [ ] Implement source monitoring service (`src/server/tax/monitoring.ts`)
- [ ] Create admin UI for adding/editing sources
- [ ] Set up scheduled job for source checking

**Acceptance Criteria**:

- Sources can be added with URL, type, and check frequency
- Scheduled job runs daily to check for updates
- Changes detected are logged for human review

### 3. RBAC & Audit Logging Baseline ✅

**Owner**: Engineering Lead
**Priority**: P0 (Critical)

**Tasks**:

- [x] Extend existing RLS policies for tax features
- [ ] Create `audit_logs` table
- [ ] Implement audit logging middleware
- [ ] Add RBAC for compliance team

**Acceptance Criteria**:

- All tax calculations are logged immutably
- Compliance team has read-only access to audit logs
- Logs include: user, timestamp, inputs, outputs, rule version

### 4. Mobile App Project Scaffolding 📱

**Owner**: Mobile Lead
**Priority**: P1 (High)

**Tasks**:

- [ ] Initialize React Native + Expo project
- [ ] Set up navigation structure (bottom tabs)
- [ ] Configure TypeScript and ESLint
- [ ] Set up shared API client with web app

**Acceptance Criteria**:

- Mobile app runs on iOS and Android simulators
- Navigation structure matches web app
- Shared types and API client work across platforms

### 5. Design System Tokens from UI Screenshots 🎨

**Owner**: Product/Design
**Priority**: P1 (High)

**Tasks**:

- [x] Extract color palette from screenshots
- [ ] Create CSS variables for design tokens
- [ ] Implement reusable component library
- [ ] Document component usage

**Acceptance Criteria**:

- Design tokens defined in `src/styles/tokens.css`
- Core components: Button, Card, Input, Icon
- Components work on web and mobile

## Implementation Plan

### Day 1-2: Database Schema & Rules Engine

1. Create migration for tax tables
2. Implement Rules Engine service
3. Add API endpoints
4. Write unit tests

### Day 3-4: Audit Logging & RBAC

1. Create audit_logs table
2. Implement logging middleware
3. Extend RLS policies
4. Test audit trail

### Day 5-6: Mobile Scaffolding & Design System

1. Initialize mobile project
2. Set up navigation
3. Create design tokens
4. Build core components

### Day 7: Integration & Testing

1. End-to-end testing
2. Documentation
3. Sprint demo prep

## Dependencies

- **Blocker**: Supabase database access (✅ Resolved)
- **Blocker**: GitHub repository access (✅ Resolved)
- **Risk**: Mobile development environment setup

## Success Metrics

- [ ] All database migrations applied successfully
- [ ] Rules engine API returns correct data
- [ ] Audit logs capture all tax calculations
- [ ] Mobile app builds and runs
- [ ] Design system components render correctly

## Sprint Demo Artifacts

- [ ] Live demo of rules engine API
- [ ] Screenshot of audit logs
- [ ] Mobile app running on simulator
- [ ] Component library Storybook

## Next Sprint Preview

**Sprint 2 Focus**: Core Calculators (Web + Mobile)

- Business Tax Calculator
- Individual Income Tax Calculator
- VAT Compliance Checker
