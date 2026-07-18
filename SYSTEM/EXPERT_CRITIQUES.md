# EXPERT CRITIQUES — 15-Discipline Audit Framework

Apply to EVERY deliverable before deployment. One error at a time. Verify after each fix.

---

## THE 15 EXPERT ROLES

### TIER 1: CRITICAL (Must pass before ANY deployment)

**1. Cybersecurity Engineer**
- Input validation & sanitization on all endpoints
- XSS, SQL injection, CSRF protection
- Secrets management (env vars, not code)
- Rate limiting on all public APIs
- Content Security Policy headers
- No PII in logs or error messages

**2. Site Reliability Engineer (SRE)**
- Retry logic with exponential backoff for external APIs
- Circuit breaker patterns
- Health check endpoints
- Monitoring and alerting
- Failure blast radius analysis
- Rollback plan documented

**3. Full-Stack Developer**
- Type safety (TypeScript strict mode)
- Error boundaries and graceful degradation
- API contract validation (both client and server)
- No `ignoreBuildErrors` or similar shortcuts
- Proper HTTP status codes
- Request/response validation

### TIER 2: HIGH (Must pass before public launch)

**4. UX/UI Designer**
- User can complete core flow without help
- Error messages are human-readable
- Progress indicators for multi-step flows
- Mobile responsive (tested at 375px, 768px, 1024px)
- No technical jargon in user-facing text
- Accessibility: keyboard navigable, screen reader compatible

**5. AI/ML Engineer** (if applicable)
- Prompt injection resistance
- Token budget documented and enforced
- Model selection strategy (cost vs quality)
- Fallback when AI is unavailable
- Conversation length limits
- Output format validation

**6. Legal Counsel**
- Privacy policy exists and is accurate
- Terms of service exist and are accurate
- GDPR/privacy compliance for collected data
- Data retention and deletion policies
- Payment processing compliance
- Disclaimer for AI-generated content

**7. DevOps/Platform Engineer**
- CI/CD pipeline configured
- Environment variables documented
- Build process is reproducible
- No hardcoded URLs or secrets
- Deployment is reversible
- Performance budgets set

### TIER 3: IMPORTANT (Before scaling)

**8. Cost/FinOps Analyst**
- Token/API cost per interaction documented
- Monthly cost projections at 100/1K/10K users
- Free tier limits documented
- Cost alerts configured
- Optimization opportunities identified
- Scaling cost model prepared

**9. Data Privacy Officer**
- What data is collected, why, how long kept
- User consent mechanisms
- Right to deletion implemented
- Cross-border data transfer compliance
- Third-party data sharing documented
- Breach notification plan

**10. QA/Test Engineer**
- Unit tests for critical paths
- Integration tests for external APIs
- Edge case coverage (empty inputs, max lengths, special chars)
- Load testing for concurrent users
- Regression test suite
- Test data doesn't contain real PII

**11. Product Manager**
- Success metrics defined and measurable
- User feedback collection mechanism
- A/B testing plan for key flows
- Feature prioritization framework
- Launch checklist complete
- Post-launch monitoring plan

### TIER 4: OPTIMIZATION (Growth phase)

**12. Performance Engineer**
- Core Web Vitals targets met (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Bundle size optimization
- Image optimization (WebP, lazy loading)
- CDN configuration
- Caching strategy
- Database query optimization

**13. Content/SEO Strategist**
- Meta tags (title, description, OG, Twitter)
- Structured data (JSON-LD)
- Sitemap and robots.txt
- Internal linking strategy
- Content freshness signals
- Keyword optimization

**14. Accessibility (a11y) Specialist**
- WCAG 2.1 AA compliance
- Color contrast ratios (4.5:1 minimum)
- Alt text on all images
- Focus management
- ARIA labels where needed
- Keyboard-only navigation tested

**15. Business/Domain Expert**
- Business rules are complete and unambiguous
- Edge cases from real-world usage covered
- Competitive analysis done
- Pricing model validated
- Customer support process defined
- Legal/regulatory compliance checked

---

## HOW TO RUN THE AUDIT

### For each deliverable:

1. **Load the file/code/component**
2. **Go through each expert role** (start with Tier 1)
3. **Each expert finds AT LEAST 1 issue** (more if possible)
4. **Log every issue** in the audit log below
5. **Assign severity**: CRITICAL / HIGH / MEDIUM / LOW
6. **Fix CRITICAL first** → verify build → fix HIGH → verify → etc.
7. **Re-run all experts** after fixes to confirm resolution

### Severity Definitions

- **CRITICAL**: Security vulnerability, data loss risk, complete feature failure
- **HIGH**: Major UX issue, missing business logic, significant cost leak
- **MEDIUM**: Suboptimal but functional, missing edge case, minor UX friction
- **LOW**: Cosmetic, nice-to-have, documentation gap

---

## AUDIT LOG

<!-- Format: [Date] | [Component] | [Expert] | [Issue] | [Severity] | [Status] -->

| Date | Component | Expert | Issue | Severity | Status |
|------|-----------|--------|-------|----------|--------|
| | | | | | |

---

## UNIVERSAL CHECKLIST (Apply to Every Project)

### Security
- [ ] All user inputs sanitized before output
- [ ] Rate limiting on all public endpoints
- [ ] CSRF protection on state-changing operations
- [ ] Secrets in environment variables, never in code
- [ ] Security headers (HSTS, CSP, X-Frame-Options, etc.)
- [ ] No sensitive data in logs
- [ ] `npm audit` returns 0 vulnerabilities
- [ ] All dependency overrides documented

### Reliability
- [ ] External API calls have retry logic (3 attempts, exponential backoff)
- [ ] Health check endpoint exists
- [ ] Error handling returns useful messages (not stack traces)
- [ ] Timeout on all external calls
- [ ] Graceful degradation when dependencies fail

### Legal/Compliance
- [ ] Privacy policy page exists and is linked
- [ ] Terms of service page exists and is linked
- [ ] Data collection is minimized (collect only what's needed)
- [ ] User consent obtained before data collection
- [ ] Right to deletion is implementable

### Quality
- [ ] TypeScript strict mode (no `ignoreBuildErrors`)
- [ ] React strict mode enabled
- [ ] Build succeeds with zero warnings
- [ ] 10+ test scenarios documented and passing
- [ ] All edge cases from audit are covered

### Operations
- [ ] Logging is structured and non-sensitive
- [ ] Monitoring/alerting configured
- [ ] Deployment is reversible (rollback plan)
- [ ] Environment variables documented
- [ ] Cost projections documented

---

## PROJECT-SPECIFIC AUDIT: LicenseDesk

### Errors Found and Fixed (2026-07-18)

| # | Error | Severity | Expert | Status |
|---|-------|----------|--------|--------|
| A | No rate limiting on /api/submit | CRITICAL | Cybersecurity | FIXED |
| B | Discord failure returns success | CRITICAL | SRE | FIXED |
| C | No input sanitization for Discord | CRITICAL | Cybersecurity | FIXED |
| D | No security headers/CSRF | CRITICAL | Cybersecurity | FIXED |
| E | ignoreBuildErrors: true, strictMode: false | HIGH | Full-Stack | FIXED |
| F | sonner.tsx imports missing next-themes | HIGH | Full-Stack | FIXED |
| G | No privacy policy or terms | HIGH | Legal | FIXED |
| H | No health check endpoint | MEDIUM | SRE | FIXED |
| I | No SEO/OpenGraph metadata | MEDIUM | SEO | FIXED |
| J | No footer links to legal pages | LOW | UX | FIXED |
| K | PostCSS XSS via unescaped style tags (GHSA-qx2v-qp2m-jg93) | HIGH | Cybersecurity | FIXED |
| L | Middleware silent failure: Buffer.from() unavailable in Edge Runtime | CRITICAL | Cybersecurity | FIXED |
| M | CSP nonce leaked via X-Nonce response header | HIGH | Cybersecurity | FIXED |
| N | Vercel CDN adds Access-Control-Allow-Origin: * (CORS wide open) | HIGH | Cybersecurity | FIXED |
| O | Email HTML injection: user data interpolated without escaping | HIGH | Cybersecurity | FIXED |
| P | Health check endpoint exposes env var configuration status | MEDIUM | Cybersecurity | FIXED |
| Q | verifySignature returns true when HMAC_SECRET empty (fail-open) | HIGH | Cybersecurity | FIXED |
| R | setInterval in rate-limit.ts dead code in serverless | LOW | SRE | FIXED |
| S | turnstileToken schema has no max length | LOW | Full-Stack | FIXED |
| T | Cache-Control no-store applied to all routes (kills static asset caching) | MEDIUM | Performance | FIXED |
| U | React hydration error #418: Math.random/new Date differ server vs client | HIGH | Full-Stack | FIXED |
| V | headers.delete() crashes Edge Runtime silently | HIGH | Cybersecurity | FIXED |
