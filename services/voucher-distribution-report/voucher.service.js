import api from "@/src/axois/axois"

export const getVoucherReport = async params => {
  try {
    const res = await api.get('/auth/get-voucher-assigned-user-list', {
      params
    })
    return res.data
  } catch (error) {
    throw new Error(error.message)
  }
}
