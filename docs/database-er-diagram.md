

\# SupportDesk Database ER Diagram



\## Entity: Ticket



```mermaid

erDiagram

&#x20;   TICKET {

&#x20;       string id PK

&#x20;       string name

&#x20;       string email

&#x20;       enum status

&#x20;       datetime createdAt

&#x20;       datetime updatedAt

&#x20;   }

```



\## Attributes



| Attribute | Data Type | Description |

|---|---|---|

| id | String | Unique ticket ID (Primary Key) |

| name | String | Customer name |

| email | String | Customer email |

| status | TicketStatus | Open, Closed, or Pending |

| createdAt | DateTime | Ticket creation date and time |

| updatedAt | DateTime | Last update date and time |



\## Business Rules



1\. Every ticket must have a unique ID.

2\. Customer name and email are required.

3\. Ticket status must be Open, Closed, or Pending.

4\. New tickets have Open status by default.

5\. The creation timestamp is automatically generated.

6\. The update timestamp is maintained automatically.

7\. Email and status fields are indexed for faster searching.



\## Relationships



The current project requirements specify only the Ticket entity. No additional entity relationships are defined at this stage.



