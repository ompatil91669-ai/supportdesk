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
## Ticket CLI

The Ticket CLI is a small TypeScript command-line tool available inside `apps/api/ticket-cli`.

### Features

- Generate unique-format SupportDesk ticket IDs.
- Convert CSV ticket records into JSON.
- Validate required CSV columns and values.
- Validate email addresses and ticket statuses.

### Prerequisites

- Node.js
- npm

### Installation

Navigate to the CLI directory:

```bash
cd apps/api/ticket-cli
npm install
```

### Generate a Ticket ID

```bash
npm start -- generate-id
```

Example output:

```text
Generated Ticket ID: TKT-20261110-625814
```

### Convert CSV to JSON

```bash
npm start -- csv-to-json sample.csv output.json
```

Example success message:

```text
CSV successfully converted to JSON!
```

### CSV Input Format

The CSV file must contain these required columns:

| Column | Description |
|---|---|
| id | Ticket ID |
| name | Customer name |
| email | Valid email address |
| status | Open, Closed, or Pending |

Example:

```csv
id,name,email,status
1,Om,om@gmail.com,Open
2,Rahul,rahul@gmail.com,Closed
```
id,name,email,status
1,"Patil, Om",om@gmail.com,Open
2,Rahul,rahul@gmail.com,Closed

### Validation Rules

- All four required columns must be present.
- Missing or extra row values are rejected.
- Required fields cannot be empty.
- Email addresses must have a valid basic format.
- Status must be Open, Closed, or Pending.
- Empty CSV input is rejected.
- Quoted CSV values containing commas are supported.
### Run Tests

```bash
npm test
```

### Build the Project

```bash
npm run build
```