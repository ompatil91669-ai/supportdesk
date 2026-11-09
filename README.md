# SupportDesk

## Project Overview

SupportDesk is a support ticket management system designed to help users create, manage, track, and resolve support requests efficiently.

The project is being developed as a monorepo containing backend, web, mobile, automation, and infrastructure components.

## Repository Structure

```text
supportdesk/
├── apps/
│   ├── api/
│   ├── web/
│   └── mobile/
├── agents/
├── automation/
│   └── n8n/
├── postman/
├── infra/
├── docs/
├── .github/
│   └── workflows/
├── .gitignore
├── .env.example
└── README.md
```

## Directory Purpose

- **apps/api:** Backend API application.
- **apps/web:** Web application.
- **apps/mobile:** Mobile application.
- **agents:** AI agent components.
- **automation/n8n:** Workflow automation files.
- **postman:** API testing collections and environments.
- **infra:** Infrastructure and deployment configuration.
- **docs:** Project documentation and Prompt Journal.
- **.github/workflows:** CI/CD workflow configurations.

## Current Project Status

- Initial monorepo structure created.
- Git repository configured.
- Feature branch created.
- Application development and configuration are pending.

## Development Approach

The project follows a modular structure and uses Git branches and Pull Requests to manage changes safely.

## Security

Never commit real credentials, passwords, API keys, or environment secrets to the repository.