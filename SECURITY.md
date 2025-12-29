# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

We take the security of Linear MCP Server seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories** (Preferred)
   - Go to the repository's Security tab
   - Click "Report a vulnerability"
   - Fill out the advisory form with details

2. **Email**
   - Send details to the repository maintainers
   - Include "SECURITY" in the subject line
   - Provide detailed information about the vulnerability

### What to Include

When reporting a vulnerability, please include:

- Type of vulnerability (e.g., injection, authentication bypass, data exposure)
- Full paths of affected source files
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability and potential attack scenarios
- Any suggested fixes (if you have them)

### Response Timeline

- **Initial Response**: Within 48 hours of report submission
- **Status Update**: Within 7 days with an assessment and timeline
- **Fix Timeline**: Critical issues within 30 days, others based on severity
- **Disclosure**: Coordinated disclosure after a fix is available

### Security Best Practices

When using Linear MCP Server, please follow these security best practices:

1. **API Key Security**
   - Store API keys in `.env` files (never commit to version control)
   - Use environment variables for production deployments
   - Rotate API keys regularly
   - Use separate keys for development and production

2. **Log Security**
   - Review logs for sensitive data before sharing
   - Keep `LOG_LEVEL` at `info` or higher in production
   - Sensitive fields are automatically redacted, but review custom logs

3. **Dependency Management**
   - Keep dependencies up to date with `npm update`
   - Review security advisories with `npm audit`
   - Use `package-lock.json` for consistent builds

4. **Access Control**
   - Limit Linear API key permissions to minimum required
   - Use team-specific API keys when possible
   - Monitor Linear API key usage for anomalies

5. **Network Security**
   - Run the MCP server in trusted environments only
   - Use HTTPS for all API communications (handled by Linear SDK)
   - Consider network isolation for production deployments

## Security Features

Linear MCP Server includes the following security features:

- **Input Validation**: All inputs validated using Zod schemas
- **Rate Limiting**: Built-in throttling to prevent API abuse
- **Sensitive Data Redaction**: Automatic redaction of API keys and secrets in logs
- **Error Handling**: Sanitized error messages to prevent information leakage
- **Retry Logic**: Exponential backoff to prevent retry storms
- **Type Safety**: TypeScript for compile-time type checking

## Known Security Considerations

- This is an MCP (Model Context Protocol) server intended for local use
- API keys are stored in configuration files - protect these files appropriately
- The server operates with the permissions of the Linear API key provided
- Log files may contain issue titles and descriptions - secure log storage accordingly

## Security Updates

Security updates are released as patch versions and documented in:
- GitHub Security Advisories
- CHANGELOG.md with `[SECURITY]` tags
- GitHub Releases with security labels

Subscribe to repository notifications to receive security update alerts.

## Acknowledgments

We appreciate the security research community's efforts in responsibly disclosing vulnerabilities. Security researchers who report valid vulnerabilities will be acknowledged in:
- CHANGELOG.md
- GitHub Security Advisories
- Release notes (with permission)

Thank you for helping keep Linear MCP Server and its users safe!
