export const actions = {
    logFrame: async ({ request }) => {
        const data = await request.formData();
        const image = data.get('image');
        console.log(image);
        
        return { success: true };
    }
};
