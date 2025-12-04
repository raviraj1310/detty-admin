import api from '@/src/axois/axois';

export const getUsers = async () => {
    try {
        const response = await api.get('/user/get-all-users');
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}
export const changeUserStatus = async (userId, status) => {
    try {
        const response = await api.put(`/user/change-status/${userId}`, { status });
        return response.data;
    } catch (error) {
        console.error('Error changing user status:', error);
        throw error;
    }
}

export const getUserWithProfile = async (userId) => {
    try {
        const response = await api.get(`/user/get-user-with-profile/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user with profile:', error);
        throw error;
    }
}


export const getAllEventBookings = async (userId) => {
    try {
        const response = await api.get(`/user-event/my-bookings/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching activity bookings:', error);
        throw error;
    }
}
export const getAllActivityBookings = async (userId) => {
    try {
        const response = await api.get(`/user-activity/get-user-bookings/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching activity bookings:', error);
        throw error;
    }
}