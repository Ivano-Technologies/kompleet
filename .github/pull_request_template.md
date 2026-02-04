# Pull Request

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Related Issues
<!-- Link to related issues using #issue_number -->

Closes #

---

## Security Checklist ✅

- [ ] No secrets committed in code
- [ ] No RLS bypass patterns
- [ ] Auth checks present for protected routes
- [ ] No sensitive data exposed in logs or responses
- [ ] Service role keys not used in frontend code

## Correctness Checklist ✅

- [ ] Logic matches requirements
- [ ] Error handling implemented
- [ ] No silent failures
- [ ] Edge cases handled

## Tests Checklist ✅

- [ ] Tests added or updated for new/changed functionality
- [ ] All tests pass locally (`npm test`)
- [ ] Tests are meaningful and cover edge cases
- [ ] Mocks are realistic and match production behavior
- [ ] No tests disabled or skipped

## Code Quality Checklist ✅

- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] Code is readable and well-documented
- [ ] No duplicated logic
- [ ] Follows existing project patterns
- [ ] No console.log statements (use logger instead)
- [ ] No unresolved TODO/FIXME comments

## Architecture Checklist ✅

- [ ] Database access uses typed client parameter pattern
- [ ] Query patterns preserved (explicit client usage)
- [ ] No breaking API changes without migration plan
- [ ] Server-side logic stays server-side
- [ ] Client-side logic stays client-side

---

## Testing Instructions
<!-- Provide step-by-step instructions for testing this PR -->

1. 
2. 
3. 

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

---

## Reviewer Notes
<!-- Any additional context for reviewers -->

## Deployment Notes
<!-- Any special deployment considerations -->

---

**By submitting this PR, I confirm that:**
- [ ] I have tested these changes locally
- [ ] I have reviewed my own code
- [ ] I have updated documentation as needed
- [ ] I have added tests that prove my fix/feature works
- [ ] All CI checks pass
