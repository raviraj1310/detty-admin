import api from '@/src/axois/axois';

export const getAllActivities = async (params = {}) => {
    try {
        const response = await api.get('/activity-type/get-all-activity', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching activities:', error);
        throw error;
    }
}

export const createActivity = async (activityData) => {
    try {
        const response = await api.post('/activity-type/create-activity', activityData);
        return response.data;
    } catch (error) {
        console.error('Error creating activity:', error);
        throw error;
    }
}

export const getActivityById = async (activityId) => {
    try {
        const response = await api.get(`/activity-type/get-activity-by-id/${activityId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching activity by ID:', error);
        throw error;
    }
}
export const updateActivity = async (activityId, activityData) => {
    try {
        const isFormData = typeof FormData !== 'undefined' && activityData instanceof FormData;
        const response = await api.put(
            `/activity-type/update-activity/${activityId}`,
            activityData,
            isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
        );
        return response.data;
    } catch (error) {
        console.error('Error updating activity:', error);
        throw error;
    }
}

// delete activity
export const deleteActivity = async (activityId) => {
    try {
        const response = await api.delete(`/activity-type/delete-activity/${activityId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting activity:', error);
        throw error;
    }
}

// Booked data

export const getIdWiseActivityBookings = async (activityId) => {
    try {
        const response = await api.get(`/activity-type/get-activity-bookings/${activityId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching activity bookings:', error);
        throw error;
    }
}

export const getAllActivityBookings = async () => {
    try {
        const response = await api.get(`activity-type/get-all-activity-bookings`);
        return response.data;
    } catch (error) {
        console.error('Error fetching activity bookings:', error);
        throw error;
    }
}

export const downloadActivityBookedTicket = async (bookingId, activityId) => {
    try {
        const idStr = String(bookingId || '').trim();
        const aidStr = String(activityId || '').trim();
        const url = aidStr
            ? `/user-activity/download-ticket/${encodeURIComponent(idStr)}?activityId=${encodeURIComponent(aidStr)}`
            : `/user-activity/download-ticket/${encodeURIComponent(idStr)}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Error downloading activity booked ticket:', error);
        throw error;
    }
}

export const viewActivityBookedTicket = async (bookingId) => {
    try {
        const idStr = String(bookingId || '').trim();
        const response = await api.get(`/user-activity/get-activity-ticket-detail/${encodeURIComponent(idStr)}`);
        return response.data;
    } catch (error) {
        console.error('Error viewing activity booked ticket:', error);
        throw error;
    }
}
