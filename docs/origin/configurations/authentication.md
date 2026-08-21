# Authentication

Configure authentication and access control for your Dagu instance.

## Available Authentication Methods

- [Builtin Authentication](authentication/builtin) - User management with role-based access control (RBAC)
- [Basic Authentication](authentication/basic) - Simple username and password authentication
- [Token Authentication](authentication/token) - API token-based authentication
- [OIDC Authentication](authentication/oidc) - OpenID Connect authentication
- [TLS/HTTPS](authentication/tls) - Encrypted connections
- [Remote Nodes](authentication/remote-nodes) - Multi-instance authentication

## Quick Start

### Builtin Authentication (Recommended)

User management with role-based access control. Supports multiple users with different roles: `admin`, `manager`, `operator`, `viewer`.

```yaml
auth:
  mode: builtin
  builtin:
    admin:
      username: admin
      # password auto-generated if not set
    token:
      secret: your-secure-random-secret
      ttl: 24h
```

Or via environment variables:

```bash
export DAGU_AUTH_MODE=builtin
export DAGU_AUTH_TOKEN_SECRET=your-secure-random-secret
```

### Basic Authentication

Simple single-user authentication without user management.

```yaml
auth:
  basic:
    username: admin
    password: secure-password
```

### Token Authentication

```yaml
auth:
  token:
    value: your-api-token
```

### OIDC Authentication

```yaml
auth:
  oidc:
    clientId: "your-client-id"
    clientSecret: "your-client-secret"
    clientUrl: "http://localhost:8080"
    issuer: "https://accounts.google.com"
```

## Choosing an Authentication Method

| Method | Use Case |
|--------|----------|
| **Builtin** | Multiple users with different permission levels, self-hosted user management |
| **Basic** | Single user, simple setup, no user management needed |
| **Token** | API-only access, automation scripts |
| **OIDC** | Enterprise SSO integration (Google, Auth0, Keycloak) |

## Environment Variables

All authentication methods support environment variable configuration. See individual authentication type documentation for details.
