import { BACKEND_DOMAIN_NAME } from '$env/static/private';

// Note: WebSocket connections and client UI logic were moved to +page.svelte
// +page.server.ts is strictly for secure, server-side actions/loaders (like database queries)

export const load = async () => {
    // You can load initial data here if needed
    return {};
};