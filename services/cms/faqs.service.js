import api from "../../src/axois/axois";

export const getAllFAQs = async () => {
  try {
    const response = await api.get("/faq/get-all-faqs");
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    throw error;
  }
};

export const getFAQById = async (faqId) => {
  try {
    const response = await api.get(`/faq/get-faq-by-id/${faqId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    throw error;
  }
};

export const createFAQ = async (data) => {
  try {
    const response = await api.post("/faq/store-faqs", data);
    return response.data;
  } catch (error) {
    console.error("Error creating FAQ:", error);
    throw error;
  }
};

export const updateFAQ = async (faqId, data) => {
  try {
    const response = await api.put(`/faq/update-faq/${faqId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating FAQ:", error);
    throw error;
  }
};

export const deleteFAQ = async (faqId) => {
  try {
    const response = await api.delete(`/faq/delete-faq/${faqId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    throw error;
  }
};

// category

export const getAllFAQCategories = async () => {
  try {
    const response = await api.get("/faq/get-all-faq-categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQ categories:", error);
    throw error;
  }
};

export const getFAQCategoryById = async (categoryId) => {
  try {
    const response = await api.get(`/faq/get-faq-category-by-id/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQ category:", error);
    throw error;
  }
};

export const createFAQCategory = async (data) => {
  try {
    const response = await api.post("/faq/create-faq-category", data);
    return response.data;
  } catch (error) {
    console.error("Error creating FAQ category:", error);
    throw error;
  }
};

export const updateFAQCategory = async (categoryId, data) => {
  try {
    const response = await api.put(
      `/faq/update-faq-category/${categoryId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error updating FAQ category:", error);
    throw error;
  }
};

export const deleteFAQCategory = async (categoryId) => {
  try {
    const response = await api.delete(`/faq/delete-faq-category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ category:", error);
    throw error;
  }
};

export const updateFAQCategoryStatus = async (categoryId, newStatus) => {
  try {
    const response = await api.put(
      `/faq/update-faq-category-status/${categoryId}`,
      {
        status: newStatus,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating FAQ category status:", error);
    throw error;
  }
};
