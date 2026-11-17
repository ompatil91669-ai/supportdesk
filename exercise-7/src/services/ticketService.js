
const ticketRepository = require("../repositories/ticketRepository");

const getAllTickets = (filters = {}) => {
  let tickets = ticketRepository.getAll();

  if (filters.status) {
    tickets = tickets.filter(
      ticket => ticket.status === filters.status
    );
  }

  if (filters.priority) {
    tickets = tickets.filter(
      ticket => ticket.priority === filters.priority
    );
  }

  return tickets;
};

const getTicketById = (id) => {
  return ticketRepository.getById(id);
};

const createTicket = (ticketData) => {
  if (!ticketData.title || !ticketData.email) {
    return {
      error: "Title and email are required"
    };
  }

  return ticketRepository.create(ticketData);
};

const updateTicket = (id, updateData) => {
  return ticketRepository.update(id, updateData);
};

const deleteTicket = (id) => {
  return ticketRepository.remove(id);
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};
