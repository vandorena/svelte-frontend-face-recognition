import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
    const accessToken = cookies.get('accessToken');

    if (!accessToken) {
        throw redirect(303, '/');
    }

    const hashedUserID = cookies.get('userID');

}