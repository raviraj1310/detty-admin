import api from '../../src/axois/axois'


export const getAllBlogs = async () => {
    try {
        const response = await api.get('/blogs/get-all-blogs');
        return response.data;
    } catch (error) {
        console.error('Error fetching blogs:', error);
        throw error;
    }
}

export const getBlogById = async (blogId) => {
    try {
        const response = await api.get(`/blogs/get-blog-by-id/${blogId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching blog:', error);
        throw error;
    }
}

export const createBlog = async (data) => {
    try {
        const response = await api.post('/blogs/create-blogs', data);
        return response.data;
    } catch (error) {
        console.error('Error creating blog:', error);
        throw error;
    }
}

export const updateBlog = async (blogId, data) => {
    try {
        const response = await api.put(`/blogs/update-blogs/${blogId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating blog:', error);
        throw error;
    }
}


export const deleteBlog = async (blogId) => {
    try {
        const response = await api.delete(`/blogs/delete-blogs/${blogId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting blog:', error);
        throw error;
    }
}
