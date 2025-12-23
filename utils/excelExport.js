import * as XLSX from "xlsx";

export const downloadExcel = (data, fileName = "data.xlsx") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName);
};

export const formatEventDate = (isoDate) => {
  const date = new Date(isoDate);
  const options = {
    weekday: "long",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleString("en-US", options);
};
// End of file
