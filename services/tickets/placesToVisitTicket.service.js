import api from "@/src/axois/axois";

export const getAllActivityTickets = async (params = {}) => {
  try {
    const response = await api.get("/activity-type/get-all-activity-tickets", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching activity tickets:", error);
    throw error;
  }
};

export const createActivityTicket = async (ticketData) => {
  try {
    const response = await api.post(
      "/activity-type/create-activity-ticket",
      ticketData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating activity ticket:", error);
    throw error;
  }
};

export const getActivityTicketById = async (ticketId) => {
  try {
    const response = await api.get(
      `/activity-type/get-ticket-by-id/${ticketId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching activity ticket by ID:", error);
    throw error;
  }
};

export const updateActivityTicket = async (ticketId, ticketData) => {
  try {
    const response = await api.put(
      `/activity-type/update-ticket/${ticketId}`,
      ticketData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating activity ticket:", error);
    throw error;
  }
};

export const deleteActivityTicket = async (ticketId) => {
  try {
    const response = await api.delete(
      `/activity-type/delete-ticket/${ticketId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting activity ticket:", error);
    throw error;
  }
};

export const updatePlaceTicketStatus = async (ticketId, status) => {
  try {
    const response = await api.put(
      `/activity-type/update-ticket-status/${ticketId}`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating activity ticket status:", error);
    throw error;
  }
};
