# 5. Skills and workflows

## Approved catalog

The approved catalog contains **17 domains and 84 candidate skills**. Candidate status is not a claim that the skills are already authored or validated.

### Project Planning

`requirements-discovery`, `user-stories`, `scope-definition`, `acceptance-criteria`, `implementation-planning`

### Software Architecture

`system-architecture`, `architecture-decisions`, `api-architecture`, `domain-modeling`, `scalability-planning`

### UI/UX Design

`design-direction`, `design-tokens`, `component-design`, `responsive-design`, `accessibility-design`, `interaction-design`

### Frontend Engineering

`react-patterns`, `nextjs-patterns`, `typescript-quality`, `form-engineering`, `state-management`, `frontend-performance`

### Backend Engineering

`rest-api-design`, `laravel-patterns`, `server-validation`, `error-handling`, `background-jobs`, `file-upload-security`

### Database Engineering

`schema-design`, `postgresql-engineering`, `mysql-engineering`, `orm-patterns`, `migration-safety`, `query-optimization`

### Authentication

`session-authentication`, `oauth-oidc`, `mfa-design`, `account-recovery`

### Authorization

`rbac-design`, `object-authorization`, `tenant-isolation`, `row-level-security`

### Application Security

`threat-modeling`, `input-output-security`, `api-abuse-protection`, `web-security-review`, `secrets-management`, `dependency-security`

### Testing & QA

`test-strategy`, `unit-testing`, `integration-testing`, `api-testing`, `e2e-testing`, `regression-testing`

### Debugging

`root-cause-analysis`, `log-investigation`, `reproduction-and-isolation`, `failure-recovery`

### Code Quality

`clean-code`, `code-review`, `refactoring`, `static-analysis`

### DevOps & Delivery

`git-workflows`, `ci-cd`, `docker-environments`, `deployment-readiness`, `rollback-planning`

### Performance

`performance-profiling`, `caching-strategy`, `load-testing`, `web-vitals`

### Documentation

`readme-authoring`, `api-documentation`, `technical-documentation`, `user-manuals`

### Operations

`observability`, `backup-recovery`, `incident-response`, `maintenance-planning`

### Privacy & Legal

`privacy-by-design`, `policy-drafting`, `cookie-compliance`, `legal-risk-review`, `license-and-claims-review`

## Eight approved packs

1. Core Engineering
2. UI/UX Design
3. Frontend
4. Backend & Database
5. Security & Identity
6. Testing & Quality
7. DevOps & Operations
8. Privacy & Compliance

Excluding a pack must never disable mandatory baseline security or quality policies.

## Twelve approved workflows

| Category | Workflow IDs |
| --- | --- |
| Project creation | `new-project`, `project-onboarding` |
| Feature development | `new-feature`, `ui-implementation`, `api-development` |
| Maintenance and quality | `bug-fix`, `refactor`, `code-review`, `security-audit` |
| Delivery and operations | `database-change`, `release-readiness`, `incident-response` |

Each workflow follows Intake & Classification → Planning & Skill Selection → Approval & Preparation → Execution → Verification & Review → Reporting & Handoff. Depth adapts to Low, Moderate, High, or Critical risk. Single-agent is the default; multi-agent use is optional only where supported.

Verification outcomes are Pass, Fail, Not Applicable (with reason), and Not Verified. A mandatory Not Verified check blocks the relevant gate.

## Canonical skill contract

Every skill is intended to define:

1. Identity & Metadata — stable ID, version, description, domain, status.
2. Activation Rules — when to use and when not to use.
3. Required Context — inputs and behavior when information is missing.
4. Instructions — procedures and decision points.
5. Outputs — artifacts and expected structure.
6. Safety Boundaries — permissions, approvals, forbidden operations.
7. Verification — tests, evidence, and acceptance checks.
8. Failure & Escalation — safe stopping conditions and handoff.

The asset taxonomy, lifecycle, and resolver expectations are described in [Architecture](02-architecture.md). The V0.1 starter set is listed in [Features and scope](03-features-and-scope.md).
