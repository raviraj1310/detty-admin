import api from '@/src/axois/axois';

export const getAllActivityTypes = async (params = {}) => {
    try {
        const response = await api.get('/activity-type/get-all-activity-types', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching activity types:', error);
        throw error;
    }
}   
export const createActivityType = async (activityTypeData) => {
    try {
        const response = await api.post('/activity-type/create-activity-type', activityTypeData);
        return response.data;
    } catch (error) {
        console.error('Error creating activity type:', error);
        throw error;
    }
}


export const updateActivityType = async (activityTypeId, activityTypeData) => {
    try {
        const response = await api.put(`/activity-type/update-activity-type/${activityTypeId}`, activityTypeData);
        return response.data;
    } catch (error) {
        console.error('Error updating activity type:', error);
        throw error;
    }
}

export const deleteActivityType = async (activityTypeId) => {
    try {
        const response = await api.delete(`/activity-type/delete-activity-type/${activityTypeId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting activity type:', error);
        throw error;
    }
}