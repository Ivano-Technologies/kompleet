# KOMPLEET Platform: Pre-Release Checklist

**Document Purpose:** Mandatory checklist that must be completed before any UI changes are merged to production.

**Last Updated:** February 13, 2026  
**Status:** Non-Negotiable System Constraint

---

## 1. Design Compliance

### Visual Design

- [ ] **No glassmorphism** - Verified no `backdrop-filter`, `blur()`, or transparent backgrounds
- [ ] **Solid surfaces only** - All cards, modals, and panels use opaque backgrounds
- [ ] **Color tokens used** - All colors reference design system tokens (no hardcoded hex)
- [ ] **Typography scale** - All text uses defined font sizes from design system
- [ ] **Spacing consistency** - Consistent padding, margins, and gaps
- [ ] **Border radius** - Consistent use of defined radius values (8px, 12px, 16px)
- [ ] **Shadows** - Only soft shadows used (no heavy drop shadows)

### Theme Support

- [ ] **Light mode tested** - All components render correctly in light theme
- [ ] **Dark mode tested** - All components render correctly in dark theme
- [ ] **Theme toggle works** - Users can switch between themes without issues
- [ ] **No theme leakage** - No hardcoded light/dark values that break theming
- [ ] **Contrast ratios** - Text meets WCAG 2.1 AA standards (4.5:1 minimum)

### Responsive Design

- [ ] **Mobile tested** - Layout works on 375px width (iPhone SE)
- [ ] **Tablet tested** - Layout works on 768px width (iPad)
- [ ] **Desktop tested** - Layout works on 1920px width
- [ ] **Touch targets** - All interactive elements are 44px minimum
- [ ] **No horizontal scroll** - Content fits within viewport at all breakpoints
- [ ] **Collapsible navigation** - Mobile menu works correctly

---

## 2. Functional Requirements

### Navigation

- [ ] **All links work** - No 404 errors on any navigation link
- [ ] **Footer links** - All footer links point to valid pages
- [ ] **Breadcrumbs** - Breadcrumbs (if present) are accurate
- [ ] **Active states** - Current page is highlighted in navigation
- [ ] **Back buttons** - All back buttons work correctly

### Forms

- [ ] **Validation works** - Client-side validation shows errors
- [ ] **Error messages** - User-friendly error messages displayed
- [ ] **Success states** - Success messages shown after submission
- [ ] **Loading states** - Buttons disabled during submission
- [ ] **Required fields** - All required fields marked and validated
- [ ] **Password strength** - Password strength indicator works (if applicable)
- [ ] **Autocomplete** - Form fields have proper autocomplete attributes

### Authentication

- [ ] **Signup works** - New users can create accounts
- [ ] **Login works** - Existing users can log in
- [ ] **Logout works** - Users can log out successfully
- [ ] **Password reset** - Forgot password flow works end-to-end
- [ ] **Protected routes** - Unauthenticated users redirected to login
- [ ] **Session persistence** - Users stay logged in across page refreshes
- [ ] **Redirect after login** - Users redirected to intended page after login

### Data Display

- [ ] **Loading states** - Skeleton loaders or spinners shown while fetching data
- [ ] **Empty states** - Appropriate messages shown when no data exists
- [ ] **Error states** - Error messages shown when data fetch fails
- [ ] **Pagination** - Pagination works correctly (if applicable)
- [ ] **Filters** - Filters apply correctly to data
- [ ] **Search** - Search functionality works as expected

---

## 3. Code Quality

### TypeScript

- [ ] **No TypeScript errors** - `pnpm build` passes without errors
- [ ] **Strict mode** - TypeScript strict mode enabled and passing
- [ ] **Type safety** - All props and functions properly typed
- [ ] **No `any` types** - Avoid using `any` unless absolutely necessary

### Linting

- [ ] **ESLint passes** - `pnpm lint` runs without errors
- [ ] **No console logs** - Remove all `console.log()` statements
- [ ] **No commented code** - Remove commented-out code blocks
- [ ] **Consistent formatting** - Code follows project formatting standards

### Performance

- [ ] **Build succeeds** - `pnpm build` completes successfully
- [ ] **No build warnings** - Build process shows no warnings
- [ ] **Bundle size** - No significant increase in bundle size
- [ ] **Image optimization** - All images use Next.js Image component
- [ ] **Lazy loading** - Heavy components lazy loaded where appropriate

### Testing

- [ ] **Tests pass** - `pnpm test` runs without failures
- [ ] **No skipped tests** - All tests enabled and passing
- [ ] **Coverage maintained** - Code coverage not decreased

---

## 4. Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

- [ ] **Tab order** - Logical tab order through interactive elements
- [ ] **Focus indicators** - Visible focus indicators on all interactive elements
- [ ] **Keyboard shortcuts** - All functionality accessible via keyboard
- [ ] **Skip links** - Skip to main content link present (if applicable)
- [ ] **Escape key** - Modals close with Escape key

### Screen Readers

- [ ] **Alt text** - All images have descriptive alt text
- [ ] **ARIA labels** - Interactive elements have proper ARIA labels
- [ ] **Semantic HTML** - Proper use of headings, lists, buttons, links
- [ ] **Form labels** - All form inputs have associated labels
- [ ] **Error announcements** - Errors announced to screen readers

### Visual Accessibility

- [ ] **Color contrast** - Text meets 4.5:1 contrast ratio (AA standard)
- [ ] **Focus visible** - Focus indicators have 3:1 contrast with background
- [ ] **No color-only info** - Information not conveyed by color alone
- [ ] **Text resize** - Text can be resized to 200% without breaking layout
- [ ] **Motion reduced** - Respects `prefers-reduced-motion` setting

---

## 5. Security

### Authentication

- [ ] **Secure passwords** - Password requirements enforced (min 6 chars)
- [ ] **HTTPS only** - All requests use HTTPS
- [ ] **Session security** - Sessions use secure, httpOnly cookies
- [ ] **CSRF protection** - CSRF tokens implemented where needed
- [ ] **Rate limiting** - Login attempts rate limited (if applicable)

### Data Protection

- [ ] **No sensitive data in logs** - No passwords, tokens, or PII logged
- [ ] **Input sanitization** - User input sanitized before display
- [ ] **XSS prevention** - React's built-in XSS protection not bypassed
- [ ] **SQL injection** - Parameterized queries used (Supabase handles this)

### Compliance

- [ ] **NDPR compliance** - Nigerian Data Protection Regulation followed
- [ ] **Privacy policy** - Privacy policy linked and accessible
- [ ] **Terms of service** - Terms of service linked and accessible
- [ ] **Cookie consent** - Cookie policy displayed (if using cookies)

---

## 6. Nigerian Market Specifics

### Localization

- [ ] **Naira symbol** - Currency displayed as ₦ (not N or NGN)
- [ ] **Date format** - Dates use DD/MM/YYYY format (Nigerian standard)
- [ ] **Phone format** - Phone numbers support +234 format
- [ ] **Tax terminology** - Correct use of VAT, WHT, PAYE, NRS

### Compliance Badges

- [ ] **NRS mentioned** - Nigerian Revenue Service compliance shown
- [ ] **NDPR badge** - Nigerian Data Protection Regulation badge displayed
- [ ] **CAC registration** - Corporate Affairs Commission registration mentioned

---

## 7. Performance Benchmarks

### Core Web Vitals

- [ ] **LCP < 2.5s** - Largest Contentful Paint under 2.5 seconds
- [ ] **FID < 100ms** - First Input Delay under 100 milliseconds
- [ ] **CLS < 0.1** - Cumulative Layout Shift under 0.1
- [ ] **TTI < 3.8s** - Time to Interactive under 3.8 seconds

### Network

- [ ] **API calls optimized** - No unnecessary API requests
- [ ] **Caching** - Appropriate use of caching strategies
- [ ] **Error handling** - Network errors handled gracefully
- [ ] **Retry logic** - Failed requests retried with exponential backoff

---

## 8. Browser Compatibility

### Desktop Browsers

- [ ] **Chrome** - Latest version tested
- [ ] **Firefox** - Latest version tested
- [ ] **Safari** - Latest version tested
- [ ] **Edge** - Latest version tested

### Mobile Browsers

- [ ] **iOS Safari** - Latest version tested
- [ ] **Chrome Android** - Latest version tested
- [ ] **Samsung Internet** - Latest version tested

---

## 9. Documentation

### Code Documentation

- [ ] **Component docs** - Complex components have JSDoc comments
- [ ] **README updated** - README reflects any new setup steps
- [ ] **Env vars documented** - New environment variables documented
- [ ] **API docs** - API endpoints documented (if applicable)

### Design Documentation

- [ ] **Design tokens** - All design tokens documented in source-of-truth.md
- [ ] **Component library** - Reusable components documented
- [ ] **Pattern library** - Common patterns documented for team reference

---

## 10. Deployment Readiness

### Environment

- [ ] **Env vars set** - All required environment variables configured
- [ ] **Database migrations** - Database schema up to date
- [ ] **Supabase config** - Supabase project configured correctly
- [ ] **Domain configured** - Custom domain (if applicable) configured

### Monitoring

- [ ] **Error tracking** - Sentry or equivalent error tracking enabled
- [ ] **Analytics** - Google Analytics or equivalent configured
- [ ] **Logging** - Structured logging implemented
- [ ] **Uptime monitoring** - Uptime monitoring service configured

### Rollback Plan

- [ ] **Git tagged** - Release tagged in Git
- [ ] **Rollback tested** - Rollback procedure tested
- [ ] **Database backups** - Recent database backup available
- [ ] **Deployment script** - Automated deployment script ready

---

## 11. User Acceptance Testing (UAT)

### Stakeholder Sign-off

- [ ] **Product Manager** - PM has reviewed and approved
- [ ] **Design Lead** - Designer has reviewed visual implementation
- [ ] **Engineering Lead** - Tech lead has reviewed code quality
- [ ] **QA Team** - QA has completed testing

### User Testing

- [ ] **Beta users tested** - At least 3 beta users have tested the feature
- [ ] **Feedback incorporated** - Critical feedback addressed
- [ ] **No blockers** - No blocking issues reported by users

---

## 12. Final Checks

### Pre-Merge

- [ ] **Branch up to date** - Branch rebased on latest main/master
- [ ] **Conflicts resolved** - No merge conflicts
- [ ] **CI/CD passes** - All CI/CD checks passing
- [ ] **PR approved** - Pull request approved by required reviewers

### Post-Merge

- [ ] **Staging deployed** - Changes deployed to staging environment
- [ ] **Smoke tests** - Basic smoke tests pass on staging
- [ ] **Production deployed** - Changes deployed to production
- [ ] **Post-deploy monitoring** - No errors in production logs (first hour)

---

## Sign-off

**Product Manager:** **********\_\_\_\_********** Date: ****\_\_****

**Engineering Lead:** **********\_\_\_\_********** Date: ****\_\_****

**QA Lead:** **********\_\_\_\_********** Date: ****\_\_****

---

**This checklist must be completed before any UI changes go to production. No exceptions.**
