import api from "../../src/axois/axois";

export const getPartner = async (payload = {}) => {
  try {
    const response = await api.get("/partner/get-all-partners", payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching partners:", error);
    throw error;
  }
};

export const deletePartner = async (partnerId) => {
  try {
    const response = await api.delete(`/partner/delete-partner/${partnerId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting partner:", error);
    throw error;
  }
};

export const updatePartner = async (partnerId, data) => {
  try {
    const response = await api.put(
      `/partner/update-partner/${partnerId}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating partner:", error);
    throw error;
  }
};

export const addPartner = async (data) => {
  try {
    const response = await api.post("/partner/create-partner", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating partner:", error);
    throw error;
  }
};

export const updatePartnerStatus = async (id, status) => {
  const res = await api.put(`/partner/partner-status/${id}`, { status });
  return res.data;
};
