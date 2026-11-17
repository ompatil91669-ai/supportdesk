
# SupportDesk – MVC Architecture Documentation

## 1. Project Overview

The SupportDesk Ticket Management application was refactored from a single-file Express application into a modular MVC architecture.

The main objective was to improve code readability, maintainability, and separation of concerns while preserving the existing API behaviour.

## 2. Project Structure

```text
exercise-7/
├── src/
│   ├── config/
│   ├── controllers/
│   │   └── ticketController.js
│   ├── middleware/
│   ├── repositories/
│   │   └── ticketRepository.js
│   ├── routes/
│   │   └── ticketRoutes.js
│   ├── services/
│   │   └── ticketService.js
│   └── app.js
├── messy-ticket-app.js
├── server.js
├── package.json
└── architecture-note.md
```

## 3. Layer Responsibilities

### Routes
Defines API endpoints and connects them to controller functions.

### Controllers
Handles HTTP requests and responses. Calls service methods and returns appropriate status codes and JSON responses.

### Services
Contains business logic, ticket filtering, and basic input validation.

### Repositories
Manages ticket data operations such as create, read, update, and delete.

### App
Configures Express, JSON middleware, and ticket routes.

### Server
Starts the Express application on the configured port.

## 4. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /tickets | Fetch all tickets |
| GET | /tickets/:id | Fetch ticket by ID |
| POST | /tickets | Create ticket |
| PUT | /tickets/:id | Update ticket |
| DELETE | /tickets/:id | Delete ticket |

Filtering is supported using status and priority query parameters.

## 5. Testing Summary

The following manual API tests were performed:

- Fetch all tickets – Passed
- Fetch ticket by ID – Passed
- Create a ticket – Passed
- Update a ticket – Passed
- Delete a ticket – Passed
- Filter by status – Passed
- Filter by priority – Passed
- Handle non-existing ticket – Passed
- Validate missing title and email – Passed

## 6. Benefits of MVC Refactoring

- Improved separation of concerns.
- Better code organization.
- Easier debugging and maintenance.
- Reusable business logic.
- Easier future testing and expansion.

## 7. Limitations

- Ticket data is stored in memory.
- Data is not persistent after server restart.
- Automated Jest tests have not yet been added for this Express exercise.
- Advanced validation and centralized error-handling middleware are future improvements.

## 8. Conclusion

The single-file Express application was reorganized into separate routes, controllers, services, and repository layers.

All nine manual API tests passed, confirming that the main CRUD operations, filtering, and basic validation work in the refactored application.
