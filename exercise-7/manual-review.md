\# Manual Code Smell Review



\## File Reviewed

exercise-7/messy-ticket-app.js



\## Code Smells Identified



1\. Single file contains all application logic.

2\. Business logic is mixed with routes.

3\. Data storage is directly inside the application file.

4\. Validation logic is repeated.

5\. Error handling is repeated in every route.

6\. Magic numbers are used.

7\. Magic strings are repeated.

8\. Unnecessary use of let.

9\. Weak email validation.

10\. Routes directly modify ticket data.

11\. Ticket lookup logic is repeated.

12\. Server port is hardcoded.

## Manual Review vs AI Review Comparison

### 1. Common Findings

The following issues were identified in both manual and AI reviews:

1. Single file contains all application logic.
2. Business logic is mixed with routes.
3. Direct data access inside the application.
4. Magic numbers and hardcoded values.
5. Weak input validation.
6. Duplicate validation logic.
7. Repeated error handling.
8. Direct modification of ticket data.
9. Hardcoded server port.

### 2. Findings Added by AI Review

The AI review identified additional issues:

1. Missing route parameter validation.
2. Inconsistent error response messages.
3. Missing error logging.
4. Inconsistent update validation.

### 3. Findings Identified in Manual Review

The manual review also identified:

1. Repeated ticket lookup logic.
2. Unnecessary use of `let`.
3. Repeated magic strings such as Open, Closed, Low, Medium and High.

### 4. Conclusion

The manual review helped identify the basic clean-code problems. The AI review provided additional findings related to validation, error handling and MVC architecture.

Both reviews show that the application needs better separation of routes, controllers, services and repositories.

No source code was modified during the review process.