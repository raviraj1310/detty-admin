import api from '@/src/axois/axois';


export const getCookies = async () => {
    try {
        const response = await api.get('/cms/get-cookies');
        return response.data;
    } catch (error) {
        console.error('Error fetching cookies:', error);
        throw error;
    }
}
export const createUpdateCookie = async (data) => {
    try {
        const response = await api.post('/cms/create-update-cookie', data);
        return response.data;
    } catch (error) {
        console.error('Error creating cookie:', error);
        throw error;
    }
}