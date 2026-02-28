import { json } from '@sveltejs/kit';
import { detectFace, searchFace } from '$lib/server/facepp';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { image } = await request.json();
        
        if (!image) {
            return json({ error: 'No image provided' }, { status: 400 });
        }

        // 1. Detect
        const detectResult = await detectFace(image);
        
        if (!detectResult.faces || detectResult.faces.length === 0) {
            return json({ found: false, message: 'No face detected' });
        }

        const face = detectResult.faces[0]; // Process checking only the first/largest face
        const faceToken = face.face_token;

        // 2. Search
        const searchResult = await searchFace(faceToken);
        
        // Face++ returns candidates. We check the top candidate.
        // Thresholds: 1e-3: 62.327, 1e-4: 71.61, 1e-5: 78.038
        // Let's use 80 as a safe confidence for "match".
        
        // If results has 'results' array
        const candidates = searchResult.results;
        
        if (candidates && candidates.length > 0) {
            const bestMatch = candidates[0];
            if (bestMatch.confidence > 80) {
                 // Found a match!
                 // The user_id is usually what we use for the name.
                 // However, we might store name separately.
                 // But let's assume we stored the name as user_id or we have a local map.
                 // Face++ allows user_id string.
                 return json({ 
                     found: true, 
                     identified: true,
                     name: bestMatch.user_id || 'Unknown (ID set)',
                     face_token: faceToken,
                     confidence: bestMatch.confidence
                 });
            }
        }

        // Not identified
        return json({ 
            found: true, 
            identified: false, 
            face_token: faceToken 
        });

    } catch (e) {
        console.error(e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
