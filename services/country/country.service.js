import api from "../../src/axois/axois";

export const getAllCountries = async (params = {}) => {
  try {
    const response = await api.get("world/get-countries", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
};

export const getCountryById = async (countryId) => {
  try {
    const response = await api.get(`/world/get-country-by-id/${countryId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching country:", error);
    throw error;
  }
};

export const createCountry = async (countryData) => {
  try {
    const response = await api.post("/world/store-country", countryData);
    return response.data;
  } catch (error) {
    console.error("Error creating country:", error);
    throw error;
  }
};

export const updateCountry = async (countryId, countryData) => {
  try {
    const response = await api.put(
      `/world/update-country/${countryId}`,
      countryData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating country:", error);
    throw error;
  }
};

export const deleteCountry = async (countryId) => {
  try {
    const response = await api.delete(`/world/delete-country/${countryId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting country:", error);
    throw error;
  }
};
