/*
 * (c) 2020 Open AR Cloud
 * This code is licensed under MIT license (see LICENSE.md for details)
*/

import {writable} from 'svelte/store'
import createAuth0Client from "@auth0/auth0-spa-js"


export const authStore = createAuthStore();

export const loading = writable(false);
export const authenticated = writable(false);
export const user = writable('');


function createAuthStore() {
    let auth0 = null;

    async function init() {
        auth0 = await createAuth0Client({
            domain: oscp_app.env["AUTH0_SCD_DOMAIN"],
            client_id: oscp_app.env["AUTH0_SCD_CLIENTID"],
            audience: oscp_app.env["AUTH0_SCD_AUDIENCE"],
            scope: oscp_app.env["AUTH0_SCD_SCOPE"]
        });

        const query = window.location.search
        if (query.includes("code=") && query.includes("state=")) {
            await auth0.handleRedirectCallback();
            window.history.replaceState({}, document.title, "/scd");
        }

        user.set(await auth0.getUser());
        authenticated.set(await auth0.isAuthenticated());
    }

    async function login() {
        await auth0.loginWithRedirect({
            redirect_uri: `${window.location.origin}/scd/`
        })
        .catch(err => {
            console.log("Log in failed", err);
        })
    }

    async function logout() {
        await auth0.logout({
            returnTo: window.location.origin
        })
        .catch (err => {
            console.log("Log out failed", err);
        })

        user.set(await auth0.getUser());
        authenticated.set(false);
    }

    async function getToken() {
        return await auth0.getTokenSilently();
    }

    return { auth0, getToken, login, logout, init }
}
