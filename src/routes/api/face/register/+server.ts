import { json } from '@sveltejs/kit';
import { addFaceToSet, setUserId } from '$lib/server/facepp';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { face_token, name } = await request.json();
        
        if (!face_token || !name) {
            return json({ error: 'Missing token or name' }, { status: 400 });
        }

        // 1. Set user_id on the face token (optional but good practice)
        // Note: user_id usually has strict char limits in Face++ compared to arbitrary names.
        // But let's try setting it. Face++ user_id: ^[a-zA-Z0-9_.@]+$ max 255.
        // We might need to sanitize or just use it if simple.
        
        // Let's just use it as 'user_id' for simplicity.
        // If name has spaces or special chars, this might fail.
        // Better: store map in our DB, and use a UUID for Face++.
        // BUT, user asked for "localStorage".
        // Let's rely on simple names or sanitized names.
        const sanitizedName = name.replace(/[^a-zA-Z0-9_.@]/g, '_');
        
        await setUserId(face_token, sanitizedName);

        // 2. Add to FaceSet
        const addResult = await addFaceToSet(face_token);
        
        if (addResult.error_message) {
             return json({ error: addResult.error_message }, { status: 500 });
        }

        return json({ success: true, stored_name: sanitizedName });

    } catch (e) {
        console.error(e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
