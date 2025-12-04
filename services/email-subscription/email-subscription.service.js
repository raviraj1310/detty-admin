import api from '@/src/axois/axois'


export const getEmailSubscriptions = async () => {
    try {
        const response = await api.get('/subscriber/get-all-news');
        return response.data;
    } catch (error) {
        console.error('Error fetching email subscriptions:', error);
        throw error;
    }
}


export const downloadEmailSubscriptionsCSV = async () => {
    try {
        const response = await api.get('/subscriber/download-csv', {
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading email subscriptions CSV:', error);
        throw error;
    }
}