import { env } from '$env/dynamic/private';

const API_KEY = env.FACEPP_API_KEY;
const API_SECRET = env.FACEPP_API_SECRET;
const FACESET_TOKEN = 'svelte_faces_v1'; // Hardcoded for simplicity, or use env

async function request(endpoint: string, formData: FormData, retryCount = 0) {
    // Start with authorization
    formData.set('api_key', API_KEY);
    formData.set('api_secret', API_SECRET);

    const response = await fetch(`https://api-us.faceplusplus.com/facepp/v3/${endpoint}`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();

    if (data.error_message && data.error_message.includes('CONCURRENCY_LIMIT_EXCEEDED')) {
        if (retryCount < 3) {
            const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
            console.log(`Concurrency limit hit for ${endpoint}. Retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return request(endpoint, formData, retryCount + 1);
        }
    }

    return data;
}

export async function detectFace(imageBase64: string) {
    const formData = new FormData();
    formData.append('image_base64', imageBase64);
    // Request minimal attributes for speed
    // return_attributes: 'none' default is fine, we just need the token
    return request('detect', formData);
}

export async function createFaceSet() {
     const formData = new FormData();
     formData.append('outer_id', FACESET_TOKEN);
     return request('faceset/create', formData);
}

export async function searchFace(faceToken: string) {
    const formData = new FormData();
    formData.append('face_token', faceToken);
    formData.append('outer_id', FACESET_TOKEN); // Search in our FaceSet
    
    // Check if FaceSet exists first? Or handle error.
    // Optimistically try search.
    const result = await request('search', formData);
    
    // Handle both potential error messages for missing FaceSet
    if (result.error_message && (result.error_message.includes('faceset_token not found') || result.error_message.includes('INVALID_OUTER_ID'))) {
        // Create if not exists (lazy initialization)
        console.log('FaceSet not found, creating new one:', FACESET_TOKEN);
        await createFaceSet();
        // Retry search (will likely be empty but valid)
        return request('search', formData);
    }
    
    return result;
}

export async function addFaceToSet(faceToken: string) {
    const formData = new FormData();
    formData.append('face_tokens', faceToken);
    formData.append('outer_id', FACESET_TOKEN);
    
    let result = await request('faceset/addface', formData);

    if (result.error_message && (result.error_message.includes('faceset_token not found') || result.error_message.includes('INVALID_OUTER_ID'))) {
        console.log('FaceSet not found during add, creating new one:', FACESET_TOKEN);
        await createFaceSet();
        // Retry add
        result = await request('faceset/addface', formData);
    }

    return result;
}

export async function setUserId(faceToken: string, userId: string) {
      const formData = new FormData();
      formData.append('face_token', faceToken);
      formData.append('user_id', userId);
      return request('face/setuserid', formData);
}
