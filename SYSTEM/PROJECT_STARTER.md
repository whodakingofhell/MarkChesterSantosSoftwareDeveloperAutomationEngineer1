# PROJECT STARTER — Universal Template

Use at the START of every new project. Copy, fill, execute.

---

## STEP 0: ENVIRONMENT

```yaml
platform: win32
shell: powershell
workspace: C:\Users\My PC\OneDrive\Desktop\AI PROJECTS\
```

### System Defaults
- **Timezone:** Asia/Manila (UTC+8, no DST)
- **Cost Target:** Free tiers until revenue justifies paid
- **AI Brain:** Claude (primary), Perplexity (research), ChatGPT/Grok (secondary)
- **Documentation:** Obsidian-compatible Markdown
- **Hosting:** Vercel (serverless) or equivalent
- **Notifications:** Discord webhooks (primary), email (secondary)

---

## STEP 1: PROJECT DEFINITION (5 minutes)

```yaml
project_name: ""
one_liner: ""
target_user: ""
core_pain_point: ""
solution_summary: ""
mvp_scope: ""
success_metric: ""
budget_cap: ""
```

## STEP 2: DOCUMENT STRUCTURE

Every project must have these files:

```
[Project]/
  vision.md              - What/why (non-technical)
  product_brief.md       - Full specification
  business_rules.md      - Hard constraints
  master_prompt.md       - AI instructions (if applicable)
  pipeline.md            - Step-by-step implementation
  token_efficiency.md    - Cost rules (if AI-powered)
  tests.md               - 10+ test scenarios
  lessons_learned.md     - Issues and fixes
  architecture.md        - System diagram
```

## STEP 3: BUILD SEQUENCE

1. Write `vision.md` (plain language)
2. Write `business_rules.md` (hard constraints)
3. Build core feature (prompt/code/config)
4. Create `tests.md` (10+ scenarios)
5. Run tests, log in `lessons_learned.md`
6. Design `architecture.md`
7. Set up integrations
8. **Run 15-expert audit** (see EXPERT_CRITIQUES.md)
9. Fix all CRITICAL/HIGH issues
10. Re-run experts after fixes
11. Deploy MVP, iterate

## STEP 4: QUALITY GATES (Non-Negotiable)

Before ANY deployment:

- [ ] All 15 expert roles reviewed (CRITICAL minimum)
- [ ] All critical issues resolved
- [ ] `npm audit` returns 0 vulnerabilities (or overrides documented)
- [ ] 10+ test scenarios pass
- [ ] No secrets in committed code
- [ ] Rate limiting on all external endpoints
- [ ] Input sanitization on all user-facing outputs
- [ ] Error handling with retry for external APIs
- [ ] Privacy policy + terms (if collecting data)
- [ ] Security headers configured
- [ ] Monitoring/logging in place
- [ ] Rollback plan documented

## STEP 5: ERROR RESOLUTION PROTOCOL

When multiple errors exist, resolve in this EXACT order:

```
1. List ALL errors (A, B, C, D...)
2. Assign severity: CRITICAL > HIGH > MEDIUM > LOW
3. Sort by severity, then by blast radius
4. Fix Error A completely → verify build
5. Fix Error B completely → verify build
6. Fix Error C completely → verify build
...continue until all fixed
7. Re-run full audit
```

**NEVER skip an error. NEVER batch fixes. ONE at a time.**

---

## STEP 6: EDGE RUNTIME CHECKLIST (Vercel/Cloudflare Workers)

Before deploying middleware or API routes to edge runtimes:

- [ ] No `Buffer` usage (use `btoa()` instead)
- [ ] No `setInterval`/`setTimeout` for cleanup (use request-time cleanup)
- [ ] No file system access (`fs`, `path`)
- [ ] No Node.js-only APIs (`child_process`, `net`, `dgram`)
- [ ] `crypto` globals only: `crypto.randomUUID()`, `crypto.subtle.*`
- [ ] Test with `next build` — edge functions compile differently than Node.js
- [ ] Verify middleware actually runs on Vercel (check response headers)
- [ ] Static asset paths excluded from middleware matcher
- [ ] CORS headers explicitly set (Vercel CDN adds `Access-Control-Allow-Origin: *` by default)
- [ ] In-memory state (Maps, counters) resets on cold start — design for it
