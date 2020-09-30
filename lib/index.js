// (c) 2020 Open AR Cloud
// This code is licensed under MIT license (see LICENSE.md for details)

/**
    Main access point to the spatial discovery services of the Open Spatial Computing Platform.
*/

import scrSchema from './scr.schema.json';
import scrEmpty from './scr.empty.json';
import scrService from './scr.service.json';

import Ajv from 'ajv';


// Allows to return local JSON response
export let local = false;

export const scr_schema = scrSchema;
export const scr_empty = scrEmpty;
export const scr_service = scrService;

const SCD_URL = 'https://dev1.scd.oscp.cloudpose.io:5000';
const SCRS_PATH = 'scrs';

const GET_METHOD = 'get';
const POST_METHOD = 'post';
const PUT_METHOD = 'put';
const DELETE_METHOD = 'delete';


/**
 * Requests the available services in the provided region and location
 *
 * The location to provide should be approximate, to prevent exposing exact client locations.
 *
 * When the global variable `local` is set to true, no server access is done, but a local result is returned instead.
 *
 * @param {string} topic
 * @param {string} h3Index  Location based on the h3 [grid system]{https://eng.uber.com/h3/}
 * @param {string} keywords
 * @returns {Promise<SCR[]> | Promise<string>} Server response Promise
 */
export function getServicesAtLocation(topic, h3Index, keywords="") {
    if (local) {
        return Promise.resolve(localServices);
    }

    if (countryCode === undefined || countryCode === ''
        || h3Index === undefined || countryCode === '') {
        throw new Error(`Check parameters: ${countryCode} ${h3Index}`);
    }

    return request(`${SCD_URL}/${SCRS_PATH}/${topic}?h3Index=${h3Index}&keywords=${keywords}`)
        .then(async (response) => await response.json())
}

/**
 * Requests the service with the provided id from the provided region
 *
 * When the global variable `local` is set to true, no server access is done, but a local result is returned instead.
 *
 * @param {string} topic
 * @param {string} id  ID of a SCR record stored on the server
 * @returns {Promise<SCR> | Promise<string>} Server response Promise
 */
export function getServiceWithId(topic, id) {
    if (local) {
        return Promise.resolve(localService);
    }

    if (id === undefined || id.length < 16) {
        throw new Error(`Check parameters: ${id}`);
    }

    return request(`${SCD_URL}/${SCRS_PATH}/${topic}/${id}`)
        .then(async (response) => await response.json())
}

/**
 * Request all services in the provided region.
 *
 * @param {string} countryCode  Short code for the region (country) to get the services for
 * @param {string} token  security token for API access authorization
 * @returns {Promise<SSR[]>}  Array of the services in SSR format
 */
export function searchServicesForTenant(countryCode, token) {
    return request(`${SSD_URL}/${countryCode}/provider/${SSRS_PATH}`, GET_METHOD, '', token)
        .then((response) => response.json())
        .then((data) => data);
}

/**
 * Post a single service record (SCR) to the server for the provided topic
 *
 * When the global variable `local` is set to true, no server access is done, but an immediate ok returned.
 *
 * @param {string} topic
 * @param {string} scr  The service record to post
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export function postService(topic, scr, token) {
    if (local) {
        return Promise.resolve('OK');
    }

    if (scr === undefined || scr.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${scr}, ${token}`);
    }

    return request(`${SCD_URL}/${SCRS_PATH}/${topic}`, POST_METHOD, scr, token)
        .then(async (response) => await response.text())
}

/**
 * Post the content of a .json file to the server for the provided topic
 *
 * Reads the contents of the file, validates it against a json schema and posts it to the server.
 *
 * @param {string} topic
 * @param {File} file  The file with the contents in SSR format to post
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export async function postScrFile(topic, file, token) {
    let content;

    return getFileContent(file)
        .then(result => content = result)
        .then(() => validateScr(content, file.name))
        .then(async () => await postService(countryCode, content, token))
}

/**
 * Put a single service record (SCR) to the server for the provided topic
 *
 * @param {string} topic
 * @param {string} scr  The service record to post
 * @param {string} id  ID of the edited record
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}
 */
export async function putService(topic, scr, id, token) {
    if (local) {
        return Promise.resolve('OK');
    }

    if (scr === undefined || scr.length === 0
        || id === undefined || id.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${scr}, ${id} ${token}`);
    }

    return request(`${SCD_URL}/${SCRS_PATH}/${topic}/${id}`, PUT_METHOD, scr, token)
        .then(async (response) => await response.text());
}

/**
 * Delete service with provided ID
 *
 * @param {string} topic
 * @param {string} id  ID of a SCR record stored for the topic
 * @param {string} token  security token for API access authorization
 * @returns {Promise<*>}  Server response Promise
 */
export function deleteWithId(topic, id, token) {
    return request(`${SCD_URL}/${topic}/${SCRS_PATH}/${id}`, DELETE_METHOD, '', token)
        .then(async (response) => await response.text())
}

/**
 * Validate the provided SCR against a json schema
 *
 * @param {string} scr  The SCR record to validate
 * @param {string} fileName  When the SCR record was loaded from a file, the respective file name
 * @returns {Promise<boolean> | Promise<string>}  The validation result or exception message
 */
export function validateScr(scr, fileName = '') {
    return new Promise((resolve, reject) => {
        let ajv = new Ajv();
        let parsed;

        try {
            parsed = JSON.parse(scr);
        } catch (error) {
            reject(`Unable to parse file content: ${fileName}, ${error}`);
        }

        let isValid = ajv.validate(ssrSchema, parsed);

        if (isValid) {
            resolve(isValid);
        } else {
            reject(`Validation of ${fileName}: ${ajv.errorsText()}`);
        }
    });
}

/**
 * Executes the actual request
 *
 * @param {string} url  The url to connect to
 * @param {string} method  The rest method to use
 * @param {string} body  The body payload if needed
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
function request(url, method = GET_METHOD, body = '', token) {
    let headers = new Headers();
    headers.append('accept', 'application/vnd.oscp+json; version=1.0;');
    headers.append('content-type', 'application/json');

    if (token) {
        headers.append('authorization', `Bearer ${token}`);
    }

    let options = {
        method: method,
        headers: headers
    }

    if (method === POST_METHOD || method === PUT_METHOD) {
        options.body = body;
    }

    return fetch(url, options)
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`${await response.text()}, ${response.statusText}`);
            }
            return response;
        });
}

/**
 * Read the contents of the provided text file
 *
 * @param {File} file  The file to read the contents from
 * @returns {Promise<string>}  The file's contents
 */
function getFileContent(file) {
    return new Promise((resolve, reject) => {
        if (file === undefined) {
            reject('Undefined file provided')
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => {
            reader.abort();
            reject(`Unable to get Content of ${file.name}: ${reader.error}`);
        };

        reader.readAsText(file);
    });
}


/** Local SCR records for testing */
export const localServices =
    [{"id":"e32ca955c776ecec","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.74437427520752,30.27830380593801],[-97.73051261901855,30.28590104010804],[-97.74703502655028,30.291014944499693],[-97.74437427520752,30.27830380593801]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:10.824Z"},{"id":"e0f25f91555e0fba","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.73042678833008,30.283677520264256],[-97.73102760314941,30.28193572785586],[-97.72969722747803,30.2815280698483],[-97.72901058197021,30.28356634294924],[-97.73042678833008,30.283677520264256]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:36.344Z"}];

/** Local SCR record for testing */
export const localService =
    {"id":"e32ca955c776ecec","type":"ssr","services":[{"type":"geopose","url":"http://geopose.geo1.example.com"},{"type":"content-discovery","url":"http://content-discovery.geo1.example.com"}],"geometry":{"type":"Polygon","coordinates":[[[-97.74437427520752,30.27830380593801],[-97.73051261901855,30.28590104010804],[-97.74703502655028,30.291014944499693],[-97.74437427520752,30.27830380593801]]]},"provider":"oscptest","timestamp":"2020-08-12T05:08:10.824Z"};
