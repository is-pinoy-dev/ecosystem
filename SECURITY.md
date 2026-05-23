# Security Policy

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, report it privately through one of the following channels:

- **GitHub Private Vulnerability Reporting** *(preferred)*: Use the [Report a vulnerability](../../security/advisories/new) button on the Security tab of this repository. This creates a private draft advisory visible only to maintainers.
- **Email**: [security@is-pinoy.dev](mailto:security@is-pinoy.dev)

Please include as much detail as possible:
- A description of the vulnerability and its potential impact
- Steps to reproduce or a proof of concept
- Affected versions or components
- Any suggested mitigations (optional)

## Response Timeline

| Milestone | Target |
|---|---|
| Acknowledgment | 48 hours |
| Triage & severity assessment | 7 days |
| Fix or mitigation | Dependent on severity |
| Public disclosure | After fix is released |

## Disclosure Policy

We follow responsible disclosure. Once a fix is released, we will:

1. Publish a GitHub Security Advisory crediting the reporter (unless anonymity is requested)
2. Tag the fix in the changelog

We ask that you give us reasonable time to address the issue before any public disclosure.

## Scope

The following are considered in scope:

- Authentication or authorization bypasses
- Remote code execution
- Data exposure or leakage
- Dependency vulnerabilities with a direct impact on this project

The following are **out of scope**:

- Vulnerabilities in third-party dependencies with no direct impact
- Theoretical attacks without a working proof of concept
- Issues already publicly known or previously reported
