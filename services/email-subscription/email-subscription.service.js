import api from "@/src/axois/axois";

// export const getEmailSubscriptions = async () => {
//   try {
//     const response = await api.get("/subscriber/get-all-news");
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching email subscriptions:", error);
//     throw error;
//   }
// };

export const getEmailSubscriptions = async ({ page = 1, limit = 10 } = {}) => {
  try {
    const res = await api.get("/subscriber/get-all-news", {
      params: { page, limit },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const downloadEmailSubscriptionsCSV = async () => {
  try {
    const response = await api.get("/subscriber/download-csv", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading email subscriptions CSV:", error);
    throw error;
  }
};
