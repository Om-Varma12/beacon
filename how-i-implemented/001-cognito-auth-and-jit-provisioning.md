# Cognito Authentication & JIT User Provisioning

## Overview

Beacon uses AWS Cognito for authentication and maintains a local users table for application-specific data.

Authentication and application data ownership are intentionally separated.

Cognito is responsible for:

* User registration
* Login
* Password management
* Email verification
* JWT issuance

Beacon is responsible for:

* Generated ideas
* Generated PPTs
* Generated documents
* User activity
* Future subscriptions and credits
* Application-specific metadata

---

# Problem

Initially there were two possible approaches.

## Option 1: Create Local User During Signup

Flow:

1. User signs up through Cognito.
2. Backend immediately creates a row in users table.
3. User verifies email later.
4. User eventually logs in.

### Problems

A user may:

* Sign up and never verify email.
* Verify email but never use the platform.
* Create multiple abandoned accounts.

This would create unnecessary records in the database.

Example:

User signs up:

```text
user@example.com
```

A row is inserted into users table.

The user never returns.

The database now contains an unused account forever.

As Beacon grows, many inactive users could accumulate.

---

## Option 2: Just-In-Time (JIT) Provisioning

Flow:

1. User signs up through Cognito.
2. User verifies email.
3. User logs in.
4. Backend validates JWT.
5. Backend checks whether the user exists locally.
6. If not found, create the user record.
7. Continue request processing.

The local user record is created only when the user actually uses the application.

This approach is called Just-In-Time (JIT) User Provisioning.

---

# Why JIT Provisioning Was Chosen

The main reason is simplicity and data cleanliness.

Benefits:

* No orphan users.
* No unused database records.
* Local users only exist if they actually access Beacon.
* Easier synchronization between Cognito and the local database.
* Simpler architecture.

Instead of synchronizing signup events between Cognito and Beacon, user creation happens naturally during the first authenticated request.

---

# Authentication Flow

## Signup

User enters:

* Email
* Password

Frontend calls Cognito signup.

Cognito:

* Creates the account.
* Sends verification code.

No local database entry is created at this stage.

---

## Verification

User enters OTP.

Cognito marks the account as verified.

Still no local database entry exists.

---

## Login

User logs in.

Cognito returns:

* ID Token
* Access Token
* Refresh Token

Frontend stores the session using Amplify.

---

## First Authenticated Request

Example:

```http
GET /api/profile
Authorization: Bearer <jwt>
```

Backend:

1. Verifies JWT signature.
2. Extracts Cognito subject identifier (`sub`).

Example:

```json
{
  "sub": "abc123xyz",
  "email": "user@example.com"
}
```

---

## Local User Lookup

Backend checks:

```sql
SELECT *
FROM users
WHERE cognito_sub = :sub;
```

### User Exists

Continue request processing.

### User Does Not Exist

Create local user:

```sql
INSERT INTO users (
    cognito_sub,
    email
)
VALUES (
    :sub,
    :email
);
```

The user is now provisioned.

This only happens once.

Future requests reuse the existing row.

---

# Why Maintain a Local Users Table

Although Cognito already stores users, Beacon still maintains a local users table.

Reason:

Application data should not depend directly on Cognito.

Future Beacon features may include:

* Credits
* Subscription plans
* Usage tracking
* Saved preferences
* Organizations
* Team collaboration
* Analytics

All of these belong in Beacon's database.

---

# User Identity Strategy

The users table contains:

```text
users
-----
id
cognito_sub
email
name
```

Example:

```text
id           = 17
cognito_sub  = abc123xyz
email        = user@example.com
```

The internal database identifier is:

```text
users.id
```

Application tables reference:

```text
user_id
```

instead of:

```text
cognito_sub
```

---

# Why Use user_id Instead of cognito_sub

Advantages:

* Smaller indexes.
* Faster joins.
* Standard relational database design.
* Easier migration if authentication providers change in the future.
* Cleaner foreign key relationships.

Example:

```text
agent_analysis
--------------
id
user_id
hackathon_id
```

instead of:

```text
agent_analysis
--------------
id
cognito_sub
hackathon_id
```

---

# Request Processing Flow

Every authenticated request follows:

```text
JWT
 ↓
Verify Signature
 ↓
Extract Cognito Sub
 ↓
Find Local User
 ↓
Get users.id
 ↓
Access Beacon Data
```

Example:

```text
JWT
 ↓
sub = abc123xyz
 ↓
users.id = 17
 ↓
SELECT * FROM agent_analysis
WHERE user_id = 17
```

---

# Scalability Considerations

The lookup:

```sql
SELECT id
FROM users
WHERE cognito_sub = :sub;
```

uses a unique indexed column.

Even at large scale this query remains extremely fast.

The cost is negligible compared to:

* LLM inference
* RAG retrieval
* Re-ranking
* PPT generation
* Document generation

Premature optimization was intentionally avoided.

If future scale requires it, Beacon can later:

* Add Redis caching.
* Cache sub → user_id mappings.
* Embed internal user IDs into JWT claims.

No database schema changes would be required.

---

# Final Decision

Beacon uses:

* AWS Cognito for authentication.
* JWT-based authorization.
* JIT user provisioning.
* Local users table.
* Internal user_id foreign keys.
* Cognito sub mapping during authenticated requests.

This design provides:

* Clean architecture.
* Simple implementation.
* Good scalability.
* Flexibility for future platform features.
