# Validation: Production Build Smoke Tests

## Libraries & Tools

- Node.js 18+ built-ins only (no test framework)
- Manual run: `npm run test:build` from `web/`

## Scorecard

- [ ] `npm run test:build` completes without hanging
- [ ] Build failure causes immediate exit with code 1 (test: break a component temporarily)
- [ ] All sitemap URLs are tested (verify count matches sitemap `<loc>` entries)
- [ ] `/login` is tested even though it's not in sitemap
- [ ] A page with `DYNAMIC_SERVER_USAGE` causes exit code 1
- [ ] All checks pass on a clean production build → exit code 0
- [ ] Server process is killed after script ends (no orphaned node processes)
- [ ] Output clearly shows ✓ / ✗ per URL

## Smoke Tests

```bash
# Run from web/ directory
cd web

# Full run — should exit 0 on a healthy build
npm run test:build

# Verify exit code
echo "Exit: $?"

# Verify no orphaned Next.js process remains
ps aux | grep "next start" | grep -v grep
# Expected: no results
```
