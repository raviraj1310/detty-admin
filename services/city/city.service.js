import api from "../../src/axois/axois";

export const getAllCities = async (params = {}) => {
  try {
    const response = await api.get("/world/all-cities", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};

export const getCityById = async (cityId) => {
  try {
    const response = await api.get(`/world/get-city-by-id/${cityId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching city:", error);
    throw error;
  }
};

export const createCity = async (cityData) => {
  try {
    const response = await api.post("/world/store-city", cityData);
    return response.data;
  } catch (error) {
    console.error("Error creating city:", error);
    throw error;
  }
};

export const updateCity = async (cityId, cityData) => {
  try {
    const response = await api.put(`/world/update-city/${cityId}`, cityData);
    return response.data;
  } catch (error) {
    console.error("Error updating city:", error);
    throw error;
  }
};

export const deleteCity = async (cityId) => {
  try {
    const response = await api.delete(`/world/delete-city/${cityId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting city:", error);
    throw error;
  }
};
