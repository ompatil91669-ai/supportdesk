
const express = require("express");
const app = express();

app.use(express.json());

let tickets = [
  { id: 1, title: "Login problem", status: "Open", priority: "High", email: "user1@gmail.com" },
  { id: 2, title: "Payment issue", status: "Closed", priority: "Low", email: "user2@gmail.com" }
];

let nextId = 3;

app.get("/tickets", (req, res) => {
  try {
    let result = tickets;

    if (req.query.status) {
      result = result.filter(t => t.status === req.query.status);
    }

    if (req.query.priority) {
      result = result.filter(t => t.priority === req.query.priority);
    }

    res.status(200).json({
      success: true,
      message: "Tickets fetched successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/tickets/:id", (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let ticket = tickets.find(t => t.id === id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching ticket" });
  }
});

app.post("/tickets", (req, res) => {
  try {
    let title = req.body.title;
    let email = req.body.email;
    let priority = req.body.priority;

    if (!title || !email || !priority) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (priority !== "Low" && priority !== "Medium" && priority !== "High") {
      return res.status(400).json({ message: "Invalid priority" });
    }

    let newTicket = {
      id: nextId,
      title: title,
      email: email,
      priority: priority,
      status: "Open"
    };

    tickets.push(newTicket);
    nextId = nextId + 1;

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: newTicket
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to create ticket" });
  }
});

app.put("/tickets/:id", (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let ticket = tickets.find(t => t.id === id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (req.body.title) {
      ticket.title = req.body.title;
    }

    if (req.body.status) {
      if (req.body.status !== "Open" && req.body.status !== "Closed") {
        return res.status(400).json({ message: "Invalid status" });
      }
      ticket.status = req.body.status;
    }

    if (req.body.priority) {
      if (req.body.priority !== "Low" && req.body.priority !== "Medium" && req.body.priority !== "High") {
        return res.status(400).json({ message: "Invalid priority" });
      }
      ticket.priority = req.body.priority;
    }

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update ticket" });
  }
});

app.delete("/tickets/:id", (req, res) => {
  try {
    let id = parseInt(req.params.id);
    let index = tickets.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    tickets.splice(index, 1);

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete ticket" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
