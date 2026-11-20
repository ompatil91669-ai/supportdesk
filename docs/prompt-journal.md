# SupportDesk - Prompt Journal

## Entry 1: Git Repository Structure

**Date:** 09 November 2026

**Context:** Creating the initial SupportDesk monorepo structure.

**Prompt Used:**
"Explain how to create a monorepo folder structure for a support ticket management system using Git."

**AI Response Summary:**
AI explained how to organize folders for API, web, mobile, agents, automation, infrastructure, documentation, and GitHub workflows.

**My Verification and Corrections:**
Created the required folders and verified the structure using the Windows tree command.

**Learning:**
Learned how a monorepo organizes multiple applications in a single repository.

---

## Entry 2: Understanding Git Branches

**Date:** 09 November 2026

**Context:** Creating a feature branch for repository setup.

**Prompt Used:**
"Explain how to create a feature branch safely without making changes directly to the main branch."

**AI Response Summary:**
AI explained the purpose of feature branches and demonstrated how to create and verify a branch using Git commands.

**My Verification and Corrections:**
Verified the current branch using `git branch --show-current` and checked the working tree using `git status`.

**Learning:**
Learned why feature branches are used for safe development and collaboration.

---

## Entry 3: Repository Documentation and Configuration

**Date:** 09 November 2026

**Context:** Preparing the initial project documentation and configuration files.

**Prompt Used:**
"Explain how to create README.md, .gitignore, and .env.example files for a SupportDesk project."

**AI Response Summary:**
AI explained the purpose of each file and provided sample content for project documentation, ignored files, and environment variables.

**My Verification and Corrections:**
Created the files, added the suggested content, and saved the changes. Ensured that real credentials were not included.

**Learning:**
Learned the importance of project documentation, Git ignore rules, and keeping sensitive information secure.

---

## Overall Learning

- Understood basic Git repository structure.
- Learned how to create and verify feature branches.
- Understood the purpose of README.md, .gitignore, and .env.example.
- Learned how to use AI for guidance and verify its suggestions.
## TypeScript CLI Development and Testing

**Project:** SupportDesk

**Tasks Completed:**
- Created a TypeScript CLI application.
- Implemented unique Ticket ID generation.
- Implemented CSV to JSON conversion.
- Configured Jest for TypeScript testing.
- Created 8 Jest test cases.
- Built the application successfully.
- Tested both CLI commands successfully.

**Debugging Practice:**
- Introduced an intentional bug by changing the Ticket ID prefix.
- Ran Jest and identified 2 failed tests.
- Fixed the bug by restoring the correct prefix.
- Reran Jest and confirmed all 8 tests passed.

**Learning:**
- TypeScript development
- CLI commands
- Jest testing
- Debugging and error fixing
- CSV and JSON handling
---

## Entry 4: Plan-First Prompting

**Date:** 10 November 2026

**Context:** Planning the TypeScript CLI development before making code changes.

**Prompt Used:**
"Review the SupportDesk Ticket CLI requirements and prepare a step-by-step implementation plan. Identify the required features, validation rules, testing requirements, and documentation tasks before suggesting code."

**AI Response Summary:**
AI helped organize the remaining work into CSV validation, CLI error handling, Ticket ID uniqueness testing, README documentation, and final verification.

**My Verification and Corrections:**
Reviewed the implementation steps and completed them one by one. Verified the code using Jest and TypeScript build commands.

**Learning:**
Learned to plan the development process before writing or modifying code.

---

## Entry 5: Clarifying Questions Prompting

**Date:** 10 November 2026

**Context:** Understanding CSV validation requirements for the Ticket CLI.

**Prompt Used:**
"Before implementing CSV validation, identify unclear requirements and ask questions about required columns, valid ticket statuses, empty fields, email validation, and malformed rows."

**AI Response Summary:**
AI helped identify important validation decisions. The required columns were id, name, email, and status. Valid statuses were Open, Closed, and Pending.

**My Verification and Corrections:**
Reviewed the requirements and implemented validation for missing columns, incorrect row values, empty fields, invalid email addresses, and invalid statuses.

**Learning:**
Learned that clarifying requirements before implementation helps avoid incorrect assumptions.

---

## Entry 6: Test-First Prompting

**Date:** 10 November 2026

**Context:** Improving CSV validation and Ticket ID functionality using Jest.

**Prompt Used:**
"Write meaningful Jest test cases for CSV validation before implementing the required validation logic. Cover valid input, empty input, missing columns, malformed rows, empty fields, invalid emails, and invalid statuses."

**AI Response Summary:**
AI helped prepare test cases before changing the CSV validation implementation.

**My Verification and Corrections:**
Initially, 7 tests failed because the existing implementation did not support the new validation requirements. Implemented the validation logic and reran the tests. All 14 tests passed. Later, added a Ticket ID uniqueness test and confirmed that all 15 tests passed.

**Learning:**
Learned how test-first development helps identify missing functionality before implementation.

---

## Entry 7: Structured Debugging Prompting

**Date:** 10 November 2026

**Context:** Debugging and improving the Ticket CLI.

**Prompt Used:**
"Help me debug the application systematically. Identify the error from the test output, explain the root cause, suggest the smallest fix, and verify the result by running the tests again."

**AI Response Summary:**
AI explained how to examine test failures, identify the root cause, fix the issue, and rerun tests.

**My Verification and Corrections:**
Previously introduced an intentional bug by changing the Ticket ID prefix from TKT to BUG. Jest identified 2 failed tests. Restored the correct prefix and confirmed that all 8 tests passed at that stage. Later, added CLI error handling and verified missing-file and missing-argument errors.

**Learning:**
Learned to debug systematically instead of changing code randomly.

---

## Additional CLI Verification

- Jest test suites: 2 passed.
- Total Jest tests: 15 passed.
- TypeScript build: Successful.
- Missing input file handling: Verified.
- Missing command arguments: Verified.
- Ticket ID uniqueness test: Passed.

## The 6-Box Prompt

The 6-Box Prompt is a structured way to give an AI clear instructions:

1. **Context:** Relevant background about the project or task.
2. **Goal:** The result the prompt should achieve.
3. **Constraints:** Requirements, boundaries, or actions to avoid.
4. **Examples:** Sample inputs or outputs that clarify expectations.
5. **Output Format:** How the response should be organized.
6. **Checks:** How to verify that the result is correct and complete.

### SupportDesk Example

- **Context:** The SupportDesk Ticket CLI is a TypeScript tool that converts CSV ticket records to JSON.
- **Goal:** Plan how to improve validation for CSV ticket records.
- **Constraints:** Keep the existing CLI commands working. Do not expose real credentials or edit files before approval.
- **Examples:** A row with a valid email and `Open` status should pass; a row with an invalid email should be rejected.
- **Output Format:** Provide a short implementation plan, followed by the files that would need changes.
- **Checks:** Include Jest tests for valid and invalid rows, and identify the test and build commands to run.

---

## Entry 8: API Skeleton and MVC in Practice

**Date:** 20 November 2026

**Context:** Building the SupportDesk REST API using Express, TypeScript, Prisma, and PostgreSQL with a structured MVC architecture.

**Prompt Used:**
"Help me build a SupportDesk API step by step using Express and TypeScript. Follow MVC architecture with separate routes, controllers, services, and repositories. Use Zod for request validation, environment variable validation, safe request logging, centralized error handling, and a consistent API response format."

**AI Response Summary:**
AI helped organize the API implementation into separate layers. Created health and ticket endpoints, connected Prisma Client, added request validation, and implemented centralized error handling.

**My Verification and Corrections:**
Verified the API using PowerShell and Postman Web. Tested GET, POST, and PATCH endpoints. Verified 400 validation errors, 404 ticket-not-found errors, and safe 500 internal server errors. Successfully generated Prisma Client and completed the TypeScript build.

**Learning:**
Learned how MVC architecture separates application responsibilities. Understood how routes, controllers, services, and repositories work together. Learned request validation, centralized error handling, Prisma integration, and API testing.

**Additional Verification:**
- API Server: Successfully started on port 5000.
- GET /health: Passed.
- GET /tickets: Passed.
- GET /tickets/:id: Passed.
- POST /tickets: Passed.
- PATCH /tickets/:id: Passed.
- Invalid request (400): Passed.
- Missing ticket (404): Passed.
- Unexpected server error (500): Passed.
- TypeScript build: Successful.
- Postman Collection: Created and imported successfully.
- DELETE endpoint: Not implemented; pending approval.


---

## Entry 9: Authentication, Authorization and API Security

**Date:** 20 November 2026

**Context:**
Implementing authentication and authorization for the SupportDesk API using Express, TypeScript, Prisma, PostgreSQL, bcrypt and JWT.

**Prompt Used:**
"Help me implement secure registration and login for the SupportDesk API. Use bcrypt for password hashing, JWT for authentication, and role-based access control for Customers and Agents. Customers should access only their own tickets, while Agents can access all tickets. Add Helmet, CORS, login rate limiting, and verify API security."

**AI Response Summary:**
AI helped implement registration and login, password hashing, JWT authentication, role-based access control, ticket ownership restrictions, Helmet, CORS and login rate limiting.

**My Verification and Corrections:**
- Verified customer registration and login.
- Tested invalid credentials (401).
- Verified JWT authentication.
- Tested customer ticket ownership restrictions.
- Verified Agent access to tickets.
- Tested Helmet security headers.
- Tested allowed and blocked CORS origins.
- Verified login rate limiting (429).
- Fixed missing rate limiter middleware in the login route.
- Successfully completed TypeScript build.
- Reviewed three OWASP security areas.

**Learning:**
Learned the difference between authentication and authorization, secure password hashing, JWT verification, role-based access control, API security middleware, and rate limiting.

**Security Review:**
- A01 Broken Access Control
- A07 Authentication Failures
- A05 Security Misconfiguration

**Git Verification:**
- Branch: feat/day10-auth-security
- Commit: e7e7509
- GitHub Push: Successful
- Pull Request: #3 created