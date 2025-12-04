import api from '../../src/axois/axois'


export const createAndUpdateAbout = async (data) => {
    try {
        const response = await api.post('/cms/create-update-about-us', data);
        return response.data;
    } catch (error) {
        console.error('Error creating about us:', error);
        throw error;
    }
}

export const getAboutUs = async () => {
    try {
        const response = await api.get('/cms/get-about-us');
        return response.data;
    } catch (error) {
        console.error('Error fetching about us:', error);
        throw error;
    }
}
