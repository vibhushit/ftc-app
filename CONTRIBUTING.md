# Contributing to FTC

Thank you for contributing to FTC.

This document outlines the development workflow and contribution guidelines followed by the project. Adhering to these guidelines helps maintain a consistent, reliable, and maintainable codebase.

## Branching Strategy

The repository follows the branching model below:

```text
feature/* → dev → qa → main
```

### Branches

| Branch      | Purpose                                   |
| ----------- | ----------------------------------------- |
| `main`      | Production-ready code                     |
| `qa`        | Release candidate for testing             |
| `dev`       | Integration branch for active development |
| `feature/*` | New features                              |
| `bugfix/*`  | Bug fixes                                 |
| `hotfix/*`  | Critical production fixes                 |

Do not commit directly to `main`, `qa`, or `dev`.

All changes must be introduced through Pull Requests.

---

## Development Workflow

1. Create a branch from `dev`.
2. Implement your changes.
3. Keep commits focused and meaningful.
4. Ensure the project builds successfully.
5. Open a Pull Request targeting `dev`.
6. Address review feedback.
7. Merge only after approval and successful CI checks.

---

## Typical Development Flow

Keep your local repository up to date.

```bash
git checkout dev
git pull origin dev
```

Create a feature branch.

```bash
git checkout -b feature/creator-search
```

Implement your changes and commit them using Conventional Commits.

```bash
git add .

git commit -m "feat: add creator search filters"
```

Push your branch.

```bash
git push -u origin feature/creator-search
```

Open a Pull Request.

```
feature/creator-search
            │
            ▼
           dev
```

After review and successful CI checks, the Pull Request will be merged into `dev`.

Changes are later promoted through the release pipeline.

```
feature/*
      │
      ▼
     dev
      │
      ▼
      qa
      │
      ▼
     main
```
---

## Commit Messages

FTC follows the **Conventional Commits** specification.

Format:

```text
<type>: <short description>
```

Examples:

```text
feat: add creator search filters
fix: resolve booking validation issue
docs: update contributing guide
refactor: simplify authentication flow
test: add booking service tests
chore: update project dependencies
```

Common commit types:

| Type       | Description                                 |
| ---------- | ------------------------------------------- |
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `docs`     | Documentation changes                       |
| `refactor` | Code improvements without changing behavior |
| `test`     | Tests                                       |
| `chore`    | Maintenance tasks                           |
| `ci`       | CI/CD changes                               |
| `build`    | Build system or dependency updates          |

---

## Pull Requests

Before opening a Pull Request:

* Ensure the project builds successfully.
* Run all relevant tests.
* Keep the Pull Request focused on a single change.
* Update documentation when necessary.
* Resolve merge conflicts before requesting review.

Pull Requests should include a clear description of the changes and their purpose.

---

## Code Review

Every Pull Request is subject to review.

Reviews are intended to:

* Maintain code quality
* Encourage consistency
* Share knowledge
* Identify potential issues early

Please address review feedback before requesting another review.

---

## General Guidelines

* Write clear, maintainable code.
* Prefer readability over cleverness.
* Avoid unrelated changes within the same Pull Request.
* Keep functions and modules focused on a single responsibility.
* Follow existing project conventions before introducing new patterns.
* When introducing significant architectural changes, document the reasoning.

---

Thank you for helping make FTC better.
