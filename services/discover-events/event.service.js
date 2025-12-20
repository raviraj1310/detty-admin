import api from "../../src/axois/axois";

export const getAllEvents = async (params = {}) => {
  try {
    const response = await api.get("/event/get-all-events", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const getEventById = async (eventId) => {
  try {
    const response = await api.get(`/event/get-event-by-id/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
};

export const getEventBookedTickets = async (eventId) => {
  try {
    const response = await api.get(
      `/event/event-wise-booked-tickets/${eventId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching event booked tickets:", error);
    throw error;
  }
};
export const getEventBookedTicket = async () => {
  try {
    const response = await api.get(`/event/event-wise-booked-tickets`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event booked tickets:", error);
    throw error;
  }
};

export const downloadBookedTickets = async (bookingId, eventId) => {
  try {
    const idStr = String(bookingId || "").trim();
    const eidStr = String(eventId || "").trim();
    const url = eidStr
      ? `/event/download-ticket/${encodeURIComponent(
          idStr
        )}?eventId=${encodeURIComponent(eidStr)}`
      : `/event/download-ticket/${encodeURIComponent(idStr)}`;
    const response = await api.get(url, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading event booked tickets:", error);
    throw error;
  }
};

export const getEventTicketSummary = async (eventId) => {
  try {
    const response = await api.get(`/event/event-ticket-summary/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event ticket summary:", error);
    throw error;
  }
};

export const addEvent = async (eventData) => {
  try {
    const response = await api.post("/event/create-event", eventData);

    return response.data;
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const getEventTypes = async () => {
  try {
    const response = await api.get("/event/get-all-event-types");
    return response.data;
  } catch (error) {
    console.error("Error fetching event types:", error);
    throw error;
  }
};

export const getVendors = async () => {
  try {
    const response = await api.get("/admin/vendor-list");
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/event/update-event/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`/event/delete-event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const getTicketDetail = async (ticketId) => {
  try {
    const response = await api.get(`/event/get-ticket-detail/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ticket detail:", error);
    throw error;
  }
};

export const copyEventById = async (eventId) => {
  try {
    const response = await api.post(`/event/copy-event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error copying event:",
      error.response?.data || error.message
    );
    throw error;
  }
};
