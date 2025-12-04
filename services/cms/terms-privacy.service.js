import api from '@/src/axois/axois';


export const getTermsCondition = async () => {
    try {
        const response = await api.get('/cms/get-cms-by-slug/terms-and-conditions');
        return response.data;
    } catch (error) {
        console.error('Error fetching terms privacy:', error);
        throw error;
    }
}
export const getPrivacyPolicy = async () => {
    try {
        const response = await api.get('/cms/get-cms-by-slug/privacy-policy');
        return response.data;
    } catch (error) {
        console.error('Error fetching privacy policy:', error);
        throw error;
    }
}
export const getTermsOfUse = async () => {
    try {
        const response = await api.get('/cms/get-cms-by-slug/terms-of-use');
        return response.data;
    } catch (error) {
        console.error('Error fetching terms of use:', error);
        throw error;
    }
}


export const createUpdateTermsPrivacy = async (data) => {
    try {
        const response = await api.post('/cms/store-or-update-cms', data);
        return response.data;
    } catch (error) {
        console.error('Error creating terms privacy:', error);
        throw error;
    }
}