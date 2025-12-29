import api from "../../src/axois/axois";

export const getAllProducts = async () => {
  try {
    const res = await api.get("/merchandise/get-all-product");
    return res.data;
  } catch (error) {
    console.log(error);
  }
};
export const createProducts = async (data) => {
  try {
    const res = await api.post("/merchandise/create-product", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProductById = async (id) => {
  try {
    const res = await api.get(`/merchandise/get-single-product/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};
export const updateProducts = async (id, data) => {
  try {
    const res = await api.put(`/merchandise/update-product/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const deleteProducts = async (id, status) => {
  try {
    const statusStr =
      typeof status === "boolean"
        ? status
          ? "true"
          : "false"
        : String(status || "").trim();
    const suffix = statusStr ? `/${encodeURIComponent(statusStr)}` : "";
    const res = await api.delete(`/merchandise/delete-product/${id}${suffix}`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const deleteHardProducts = async (id) => {
  try {
    const res = await api.delete(`/merchandise/hard-delete-product/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const changeMerchandiseStatus = async (id, status) => {
  try {
    const response = await api.put(
      `/merchandise/update-product-status/${id}`,
      { status } // boolean
    );
    return response.data;
  } catch (error) {
    console.error("Error updating merchandise status:", error);
    throw error;
  }
};
