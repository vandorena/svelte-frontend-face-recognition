import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { BACKEND_DOMAIN_NAME, BEARER_TOKEN_BACKEND, ENCRYPTION_KEY } from '$env/static/private';
import { createDecipheriv } from 'crypto';

function unhashUserID(hashedUserID: string): string {
    const parts = hashedUserID.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export const load: LayoutServerLoad = async ({ cookies }) => {
    const hashedUserID = cookies.get('userID');

    if (!hashedUserID) {
        throw redirect(303, '/');
    }

    const userID = unhashUserID(hashedUserID);

    if (!userID) {
        throw redirect(303, '/');
    }

    // Make request to API to verify user access
    const response = await fetch(`https://${BACKEND_DOMAIN_NAME}/users/${userID}/exists`, {
        headers: {
            'Authorization': `${BEARER_TOKEN_BACKEND}`
        }
    });

    const data = await response.json();

    if (!data || !data.exists) {
        throw redirect(303, '/');
    }

    // Send logged in notification
    const loginResponse = await fetch(`https://${BACKEND_DOMAIN_NAME}/users/${userID}/loggedin`, {
        method: 'POST',
        headers: {
            'Authorization': `${BEARER_TOKEN_BACKEND}`
        }
    });
    console.log(`Logged in notification sent for user ${userID}`, loginResponse);

    // Fetch user data
    const userDataResponse = await fetch(`https://${BACKEND_DOMAIN_NAME}/users/${userID}`, {
        headers: {
            'Authorization': `${BEARER_TOKEN_BACKEND}`
        }
    });

    let userName = '';
    if (userDataResponse.ok) {
        const userData = await userDataResponse.json();
        userName = `${userData.first_name} ${userData.last_name}`;
    }
    
    return {
        userID,
        userName,
        weekStatus
    };
};