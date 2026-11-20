
const ticketService = require("../services/ticketService");

const getAllTickets = (req, res) => {
  const tickets = ticketService.getAllTickets({
    status: req.query.status,
    priority: req.query.priority
  });

  res.status(200).json({
    success: true,
    message: "Tickets fetched successfully",
    data: tickets
  });
};

const getTicketById = (req, res) => {
  const ticket = ticketService.getTicketById(
    parseInt(req.params.id, 10)
  );

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found"
    });
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
};

const createTicket = (req, res) => {
  const result = ticketService.createTicket(req.body);

  if (result.error) {
    return res.status(400).json({
      success: false,
      message: result.error
    });
  }

  res.status(201).json({
    success: true,
    message: "Ticket created successfully",
    data: result
  });
};

const updateTicket = (req, res) => {
  const ticket = ticketService.updateTicket(
    parseInt(req.params.id, 10),
    req.body
  );

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found"
    });
  }

  res.status(200).json({
    success: true,
    message: "Ticket updated successfully",
    data: ticket
  });
};

const deleteTicket = (req, res) => {
  const deleted = ticketService.deleteTicket(
    parseInt(req.params.id, 10)
  );

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Ticket not found"
    });
  }

  res.status(200).json({
    success: true,
    message: "Ticket deleted successfully"
  });
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};
