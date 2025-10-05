# Git Commit Message Guidelines

## ⚠️ CRITICAL: Keep Messages SHORT

**Problem**: Long commit messages cause VSCode PTY host disconnections and terminal freezes.

**Solution**: Use SHORT, concise messages (< 50 characters preferred).

## ✅ Good Examples (SHORT)

```bash
git commit -m "Fix health check timeout"
git commit -m "Update IAM roles"
git commit -m "Add logging to Dockerfile"
git commit -m "Fix DNS configuration"
git commit -m "Update CDK stack"
```

## ❌ Bad Examples (TOO LONG - AVOID)

```bash
# DON'T DO THIS - Will freeze terminal:
git commit -m "Fix 504 Gateway Timeout error by updating health check path from / to /health and increasing timeout from 5 seconds to 10 seconds while also adding comprehensive startup logging to the Docker container"
```

## Message Format

```bash
# Template (keep under 50 chars):
<action> <what> [<where>]

# Examples:
git commit -m "Fix API timeout"           # 16 chars ✅
git commit -m "Add health check"          # 16 chars ✅
git commit -m "Update workflow config"    # 22 chars ✅
git commit -m "Refactor auth logic"       # 19 chars ✅
```

## Multi-line Messages (If Needed)

If you need more detail, use the `-m` flag multiple times:

```bash
git commit -m "Fix health check" \
           -m "Update path to /health" \
           -m "Increase timeout to 10s"
```

Or use an editor:
```bash
git commit
# This opens editor where you can write:
# Line 1: Short summary (< 50 chars)
# Line 2: <blank>
# Line 3+: Detailed explanation
```

## Quick Commit Workflow

```bash
# Status check
git status

# Stage all changes
git add -A

# Commit with short message
git commit -m "Fix DNS setup"

# Push
git push origin kitty

# Or all in one line:
git add -A && git commit -m "Update config" && git push origin kitty
```

## Common Short Messages

| Task | Message |
|------|---------|
| Bug fix | `"Fix [component] bug"` |
| New feature | `"Add [feature]"` |
| Update config | `"Update [file] config"` |
| Refactor | `"Refactor [component]"` |
| Documentation | `"Update docs"` |
| Dependencies | `"Update dependencies"` |
| Security | `"Fix security issue"` |
| Performance | `"Improve [component]"` |
| Tests | `"Add [component] tests"` |

## For Complex Changes

Use GitHub PR descriptions for detailed explanations instead of commit messages:

```bash
# In terminal (short):
git commit -m "Refactor auth system"

# In GitHub PR (detailed):
Title: Refactor auth system
Description:
- Updated OAuth flow
- Fixed token refresh
- Added error handling
- Improved logging
```

---

**Remember**: Short commit messages prevent terminal freezes!
