# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in JobPulse, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email **opeblow2021@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive an acknowledgement within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Scope

This policy applies to the JobPulse application code in this repository. It does **not** cover vulnerabilities in third-party services (Convex, OpenAI, Firecrawl, AgentMail) — report those to their respective security teams.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Best Practices

- Never commit API keys or secrets to the repository.
- Use `.env.local` for local development; use Convex dashboard env vars for production.
- Rotate any key that may have been exposed immediately.
