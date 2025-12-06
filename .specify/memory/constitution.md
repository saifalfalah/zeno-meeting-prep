<!--
Sync Impact Report - Constitution Update

Version change: Initial → 1.0.0
Modified principles: N/A (initial version)
Added sections:
  - Core Principles (5 principles: Code Quality, Testing Standards, User Experience Consistency, Performance Requirements, Simplicity & Maintainability)
  - Development Standards (Code review and quality gates)
  - Review & Quality Gates (Pre-commit and deployment requirements)
  - Governance (Amendment and compliance procedures)

Removed sections: None

Templates requiring updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section ready
  ✅ .specify/templates/spec-template.md - Success criteria align with performance/UX principles
  ✅ .specify/templates/tasks-template.md - Task structure supports quality gates
  ✅ .specify/templates/checklist-template.md - Compatible with constitution checks
  ✅ .specify/templates/agent-file-template.md - Generic structure, no updates needed

Follow-up TODOs: None
-->

# Zeno Meeting Prep Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

Code MUST be readable, maintainable, and self-documenting. Every piece of code written must adhere to these non-negotiable standards:

- **Self-Documenting Code**: Variable and function names MUST clearly express intent without requiring comments. Comments are only permitted where the logic is genuinely complex or requires context that cannot be expressed through code structure.
- **Single Responsibility**: Each function, class, and module MUST have one clear purpose. Functions exceeding 50 lines require explicit justification in code review.
- **DRY Principle**: Code duplication is prohibited. Three or more instances of similar logic MUST be abstracted into a reusable function or module.
- **Type Safety**: All languages supporting type systems MUST use them rigorously. Implicit `any` types or untyped variables are prohibited except where external API constraints require them.
- **Error Handling**: All error cases MUST be handled explicitly. Silent failures are prohibited. Errors MUST provide actionable context.
- **No Magic Values**: Hard-coded values (strings, numbers) MUST be extracted to named constants with clear semantic meaning.

**Rationale**: Code is read 10x more than it is written. Maintainability directly impacts velocity, reduces bugs, and enables team scalability.

### II. Testing Standards (NON-NEGOTIABLE)

Testing is mandatory for all production code. The testing discipline follows a strict hierarchy:

- **Test-First Development**: For all net-new features, tests MUST be written before implementation (Red-Green-Refactor). Tests must FAIL before implementation begins.
- **Test Coverage Minimums**:
  - Unit test coverage MUST exceed 80% for business logic
  - Integration tests MUST cover all API contracts and inter-service communication
  - End-to-end tests MUST validate each user story acceptance scenario
- **Contract Testing**: All API endpoints, library exports, and shared schemas MUST have contract tests. Breaking changes to contracts require explicit versioning and migration paths.
- **Test Quality**: Tests MUST be deterministic, isolated, fast (<5s for unit tests), and readable. Flaky tests are treated as failing tests and MUST be fixed or removed immediately.
- **Test Organization**: Tests MUST mirror source structure:
  - `tests/unit/` for isolated function/class tests
  - `tests/integration/` for cross-component/service tests
  - `tests/contract/` for API/interface contract validation

**Rationale**: Testing is our safety net for refactoring, prevents regressions, and serves as living documentation of system behavior. Contract testing ensures backward compatibility and safe evolution.

### III. User Experience Consistency (NON-NEGOTIABLE)

All user-facing interfaces MUST provide a consistent, predictable, and delightful experience:

- **Design System Adherence**: All UI components MUST follow the established design system. Custom styling requires explicit design review and approval.
- **Accessibility Standards**: WCAG 2.1 Level AA compliance is mandatory. This includes keyboard navigation, screen reader support, color contrast ratios, and focus management.
- **Error Messages**: User-facing errors MUST be human-readable, actionable, and never expose internal implementation details. Every error state MUST suggest a concrete next step.
- **Loading States**: Any operation exceeding 200ms MUST display a loading indicator. Operations exceeding 3 seconds MUST show progress feedback.
- **Responsive Design**: All interfaces MUST be fully functional across mobile (320px), tablet (768px), and desktop (1440px+) viewports.
- **Internationalization Ready**: Text MUST be externalized from code using i18n frameworks. Hard-coded user-facing strings are prohibited.

**Rationale**: Consistency reduces cognitive load, improves learnability, and builds user trust. Accessibility is both a legal requirement and moral imperative.

### IV. Performance Requirements (NON-NEGOTIABLE)

Performance is a feature, not an optimization. All production code MUST meet these performance budgets:

- **Response Time Targets**:
  - API endpoints MUST respond in <200ms at p95 under normal load
  - UI interactions MUST provide feedback within 100ms (perceived responsiveness)
  - Page load time MUST be <3 seconds on 3G networks
- **Resource Constraints**:
  - Client bundle size MUST NOT exceed 300KB gzipped for initial load
  - Memory usage MUST remain stable under sustained operation (no leaks)
  - Database queries MUST use indexed fields; full table scans are prohibited
- **Scalability Baselines**:
  - Systems MUST handle 10x current load without architecture changes
  - Horizontal scaling MUST be supported (no singleton bottlenecks)
  - Graceful degradation MUST occur under load (queue, not crash)
- **Monitoring & Budgets**: All performance-critical paths MUST have metrics and alerts. Performance regressions caught in CI MUST block deployment.

**Rationale**: Performance directly impacts user satisfaction, conversion rates, and operational costs. Setting budgets early prevents expensive rewrites later.

### V. Simplicity & Maintainability

Favor the simplest solution that meets requirements. Complexity must be explicitly justified:

- **YAGNI Principle**: Features and abstractions MUST NOT be built for hypothetical future needs. Implement only what is required today.
- **Minimal Dependencies**: New dependencies MUST be justified. Prefer standard library solutions over third-party packages when viable.
- **Technology Choices**: Adopt established, well-documented technologies with active communities. Experimental frameworks require architecture review.
- **Refactoring Discipline**: Code that becomes complex during implementation MUST be refactored before merging. "Works but messy" is not acceptable.
- **Configuration**: Avoid over-configuration. Sensible defaults MUST be provided. Configuration options require explicit user research justification.

**Rationale**: Simple systems are easier to understand, debug, and evolve. Every abstraction carries cognitive overhead—it must earn its place.

## Development Standards

### Code Review Requirements

All code changes MUST pass code review before merging:

- **Constitution Compliance**: Reviewers MUST verify adherence to all principles above
- **Test Verification**: Reviewers MUST verify tests exist, pass, and adequately cover the changes
- **Performance Check**: Reviewers MUST flag any potential performance regressions
- **UX Consistency**: Reviewers MUST verify user-facing changes align with design system and accessibility standards
- **Documentation**: Public APIs, complex logic, and architectural decisions MUST be documented

### Quality Gates

The following gates MUST pass before code reaches production:

1. **Pre-Commit**: Linting, formatting, type checking MUST pass locally
2. **CI Pipeline**: All automated tests, security scans, and performance benchmarks MUST pass
3. **Code Review**: At least one approval from a team member familiar with the area
4. **Staging Validation**: Changes MUST be validated in staging environment before production deployment

## Governance

### Amendment Process

This constitution can be amended through the following process:

1. **Proposal**: Any team member can propose an amendment via documented RFC
2. **Review Period**: Minimum 5 business days for team review and feedback
3. **Approval**: Requires consensus from technical leadership
4. **Migration Plan**: Breaking changes MUST include a migration path and timeline
5. **Version Update**: Constitution version MUST be incremented per semantic versioning:
   - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance & Enforcement

- **Code Review**: Every pull request MUST verify compliance with this constitution
- **Retrospectives**: Constitution adherence MUST be discussed in sprint retrospectives
- **Violations**: Repeated violations MUST be addressed through team discussion and process improvement, not individual blame
- **Living Document**: This constitution MUST evolve with the team's learning and project needs

### Complexity Justification

When a principle must be violated due to genuine technical constraints:

1. Document the violation in code comments and pull request description
2. Explain why the standard solution is insufficient
3. Describe simpler alternatives that were rejected and why
4. Create a technical debt ticket to revisit the decision in the future

**Version**: 1.0.0 | **Ratified**: 2025-12-06 | **Last Amended**: 2025-12-06
