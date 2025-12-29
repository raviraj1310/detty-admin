import api from "../../src/axois/axois";

export const getAllEventsTypes = async (params = {}) => {
  try {
    const response = await api.get("/event/get-all-event-types", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const getEventTypeById = async (eventTypeId) => {
  try {
    const response = await api.get(
      `/event/get-event-type-by-id/${eventTypeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching event type:", error);
    throw error;
  }
};

export const createEventType = async (eventTypeData) => {
  try {
    const response = await api.post("/event/create-event-type", eventTypeData);
    return response.data;
  } catch (error) {
    console.error("Error creating event type:", error);
    throw error;
  }
};

export const updateEventType = async (eventTypeId, eventTypeData) => {
  try {
    const response = await api.put(
      `/event/update-event-type/${eventTypeId}`,
      eventTypeData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating event type:", error);
    throw error;
  }
};

export const deleteEventType = async (eventTypeId) => {
  try {
    const response = await api.delete(
      `/event/delete-event-type/${eventTypeId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting event type:", error);
    throw error;
  }
};

export const restoreEventType = async (eventTypeId) => {
  try {
    const response = await api.put(`/event/restore-event-type/${eventTypeId}`);
    return response.data;
  } catch (error) {
    console.error("Error restoring event type:", error);
    throw error;
  }
};

export const changeEventTypeStatus = async (id, status) => {
  const response = await api.put(`/event/update-event-type-status/${id}`, {
    status,
  });
  return response.data;
};
