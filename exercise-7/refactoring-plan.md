\# SupportDesk – Refactoring Plan



\## 1. Objective



Refactor the messy Express.js ticket application into a clean MVC architecture while preserving its existing API behaviour.



\## 2. Proposed Folder Structure



```text

src/

├── routes/

│   └── ticketRoutes.js

├── controllers/

│   └── ticketController.js

├── services/

│   └── ticketService.js

├── repositories/

│   └── ticketRepository.js

├── middleware/

│   ├── validateTicket.js

│   └── errorHandler.js

├── config/

│   └── config.js

└── app.js



server.js

```



\## 3. Refactoring Steps



1\. Create the required folders and files.

2\. Move API endpoint definitions into ticketRoutes.js.

3\. Move HTTP request and response handling into ticketController.js.

4\. Move ticket business logic into ticketService.js.

5\. Move ticket data access operations into ticketRepository.js.

6\. Create reusable validation middleware.

7\. Implement centralized error handling.

8\. Move server port configuration into environment variables.

9\. Keep the existing API endpoints and response behaviour unchanged.



\## 4. Testing Strategy



\### Before Refactoring

\- Test GET all tickets.

\- Test GET ticket by ID.

\- Test POST new ticket.

\- Test PUT ticket update.

\- Test DELETE ticket.

\- Test invalid input and missing ticket scenarios.

\- Record the existing API responses.



\### After Refactoring

\- Run the same tests again.

\- Compare API responses with the original behaviour.

\- Verify all CRUD operations.

\- Verify validation and error handling.

\- Confirm that no existing functionality is broken.



\## 5. Approval



The refactoring will begin only after the refactoring plan is reviewed and approved by the lead.



\## 6. Expected Outcome



A clean, modular and maintainable Express.js application following MVC principles with separate routes, controllers, services and repositories.

