\# End of Day Report – Week 2, Day 3



\*\*Date:\*\* 20 November 2026

\*\*Project:\*\* SupportDesk

\*\*Task:\*\* API Skeleton and MVC in Practice



\## 1. Work Completed



\- Created the Express API using TypeScript.

\- Implemented MVC architecture with routes, controllers, services, and repositories.

\- Integrated Prisma Client with PostgreSQL.

\- Added Zod validation for environment variables and ticket requests.

\- Implemented safe request logging middleware.

\- Implemented centralized error handling.

\- Created the `/health` endpoint.

\- Implemented GET, POST, and PATCH ticket endpoints.

\- Created a Postman collection and imported it into Postman Web.



\## 2. Testing and Verification



| Test | Result |

|---|---|

| GET /health | Passed |

| GET /tickets | Passed |

| GET /tickets/:id | Passed |

| POST /tickets | Passed |

| PATCH /tickets/:id | Passed |

| Invalid request – 400 | Passed |

| Missing ticket – 404 | Passed |

| Unexpected error – 500 | Passed |

| TypeScript build | Successful |



\## 3. Challenges Faced



\- Fixed TypeScript compatibility issues by using TypeScript 5.9.3.

\- Generated Prisma Client to resolve initialization errors.

\- Fixed a TypeScript typing issue in the 500 error test.

\- Resolved the Postman Web connection issue by starting the API server.



\## 4. Learning Outcomes



\- Understood MVC architecture and separation of responsibilities.

\- Learned how Express routes, controllers, services, and repositories work together.

\- Practised Prisma database integration.

\- Learned request validation using Zod.

\- Understood centralized error handling and safe API responses.

\- Practised API testing using PowerShell and Postman Web.



\## 5. Pending Items



\- DELETE endpoint is not implemented and remains pending approval.

\- Final Git commit and repository verification are pending.



\## 6. Overall Status



Core API implementation, testing, and TypeScript build completed successfully.
