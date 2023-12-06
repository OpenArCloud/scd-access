/*
 * (c) 2020 Open AR Cloud
 * This code is licensed under MIT license (see LICENSE.md for details)
 */

import { writable } from 'svelte/store';
import createAuth0Client, { Auth0Client, User } from '@auth0/auth0-spa-js';

export const authStore = createAuthStore();

export const loading = writable(false);
export const authenticated = writable(false);
export const user = writable<User | undefined>(undefined);

function createAuthStore(): {
    auth0: Auth0Client | null;
    getToken: () => Promise<string | undefined>;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    init: (auth_domain: string, auth_client_id: string, auth_audience: string, auth_scope: string) => Promise<void>;
} {
    let auth0: Auth0Client | null = null;

    // The application using this library should pass the settings as parameters here
    async function init(auth_domain: string, auth_client_id: string, auth_audience: string, auth_scope: string) {
        auth0 = await createAuth0Client({
            domain: auth_domain,
            client_id: auth_client_id,
            audience: auth_audience,
            scope: auth_scope,
        });

        const query = window.location.search;
        if (query.includes('code=') && query.includes('state=')) {
            await auth0.handleRedirectCallback();
            window.history.replaceState({}, document.title, '/scd');
        }

        user.set(await auth0.getUser());
        authenticated.set(await auth0.isAuthenticated());
    }

    async function login() {
        await auth0
            ?.loginWithRedirect({
                redirect_uri: `${window.location.origin}/scd/`,
            })
            ?.catch((err) => {
                console.log('Log in failed', err);
            });
    }

    async function logout() {
        await auth0
            ?.logout({
                returnTo: window.location.origin,
            })
            ?.catch((err) => {
                console.log('Log out failed', err);
            });

        user.set(await auth0?.getUser());
        authenticated.set(false);
    }

    async function getToken() {
        return await auth0?.getTokenSilently();
    }

    return { auth0, getToken, login, logout, init };
}
