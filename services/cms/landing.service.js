import api from '../../src/axois/axois'


export const getLandingData = async () => {
    try {
        const response = await api.get('cms/landing');
        return response.data;
    } catch (error) {
        console.error('Error fetching landing data:', error);
        throw error;
    }
}

export const storeOrUpdateLanding = async (data) => {
    try {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        const response = await api.post('cms/store-or-update-landing', data, isFormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined);
        return response.data;
    } catch (error) {
        console.error('Error storing or updating landing data:', error);
        throw error;
    }
}
