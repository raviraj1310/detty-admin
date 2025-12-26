import api from "@/src/axois/axois";

export const createPromoBanner = async (payload) => {
  try {
    const response = await api.post("/promo-banner/create-banner", payload);
    return response.data;
  } catch (error) {
    console.error("Error creating promo banner:", error);
    throw error;
  }
};

export const getAllPromoBanners = async () => {
  try {
    const response = await api.get("/promo-banner/get-all-banners");
    return response.data;
  } catch (error) {
    console.error("Error fetching promo banners:", error);
    throw error;
  }
};

export const getPromoById = async (promoBannerId) => {
  try {
    const response = await api.get(
      `/promo-banner/get-banner-by-id/${promoBannerId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching promo banner:", error);
    throw error;
  }
};

export const updatePromoBanner = async (promoBannerId, payload) => {
  try {
    const isFormData =
      typeof FormData !== "undefined" && payload instanceof FormData;
    const response = await api.put(
      `/promo-banner/update-banner/${promoBannerId}`,
      payload,
      isFormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined
    );
    return response.data;
  } catch (error) {
    console.error("Error updating promo banner:", error);
    throw error;
  }
};

export const deletePromoBanner = async (promoBannerId) => {
  try {
    const response = await api.delete(
      `/promo-banner/delete-banner/${promoBannerId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting promo banner:", error);
    throw error;
  }
};

export const updateBannerStatus = async (bannerId, status) => {
  const res = await api.put(`/promo-banner/update-status/${bannerId}`, {
    status,
  });
  return res.data;
};
