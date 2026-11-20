
let tickets = [
  {
    id: 1,
    title: "Login problem",
    status: "Open",
    priority: "High",
    email: "user1@gmail.com"
  },
  {
    id: 2,
    title: "Payment issue",
    status: "Closed",
    priority: "Low",
    email: "user2@gmail.com"
  }
];

let nextId = 3;

const getAll = () => tickets;

const getById = (id) => {
  return tickets.find(ticket => ticket.id === id);
};

const create = (ticketData) => {
  const newTicket = {
    id: nextId++,
    ...ticketData
  };

  tickets.push(newTicket);
  return newTicket;
};

const update = (id, updateData) => {
  const ticket = getById(id);

  if (!ticket) return null;

  Object.assign(ticket, updateData);
  return ticket;
};

const remove = (id) => {
  const index = tickets.findIndex(ticket => ticket.id === id);

  if (index === -1) return false;

  tickets.splice(index, 1);
  return true;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
