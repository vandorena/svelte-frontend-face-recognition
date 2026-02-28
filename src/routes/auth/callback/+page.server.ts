import { redirect, isRedirect, isHttpError } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { BEARER_TOKEN_BACKEND, BACKEND_DOMAIN_NAME, ENCRYPTION_KEY, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_GOOGLE_CLIENT_ID, PUBLIC_GOOGLE_REDIRECT_URI } from '$env/static/public';
import type { PageServerLoad } from './$types';
import { createCipheriv, randomBytes } from 'crypto';

if (dev) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

function hashUserID(userID: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(userID, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
        console.error('OAuth error:', error, errorDescription);
        throw redirect(302, '/');
    }

    if (!code) {
        console.error('No authorization code received');
        throw redirect(302, '/');
    }

    try {
        const params = new URLSearchParams({
            client_id: PUBLIC_GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: PUBLIC_GOOGLE_REDIRECT_URI,
            code: code,
            grant_type: 'authorization_code'
        });

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            throw redirect(302, '/');
        }

    const data = await tokenResponse.json();
    const accessToken = data.access_token;

    const user_info = await fetch(`https://openidconnect.googleapis.com/v1/userinfo`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!user_info.ok) {
            console.error('Failed to fetch user info from Google');
            throw redirect(302, '/');
        }

        const user_profile = await user_info.json();
        console.log('User fetched successfully from Google:', user_profile);

        const userResponse = await fetch(`http://${BACKEND_DOMAIN_NAME}/users/${encodeURIComponent(user_profile.sub)}`, {
            headers: {
                'Authorization': `${BEARER_TOKEN_BACKEND}`
            }
        });

        let user = await userResponse;

        console.log(user)

        if (userResponse.status === 422 || userResponse.status === 503) {
            console.log('User not found for sub, creating new user');
            const createUser = await fetch(`http://${BACKEND_DOMAIN_NAME}/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `${BEARER_TOKEN_BACKEND}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: user_profile.sub,
                    email: user_profile.email
                })
            });

            let new_user = await createUser;
            console.log('User created successfully:', new_user);

    };
    } catch (err) {
        console.error('', err);
        throw redirect(302, '/');
    }};
