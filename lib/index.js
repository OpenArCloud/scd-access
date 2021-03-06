// (c) 2020 Open AR Cloud
// This code is licensed under MIT license (see LICENSE.md for details)

/**
    Main access point to the spatial discovery services of the Open Spatial Computing Platform.
*/

import scrSchema from './scr.schema.json';
import scrEmpty from './scr.empty.json';
import scrReference from './scr.reference.json';

import Ajv from 'ajv';


// Allows to return local JSON response
export let local = false;

export const scr_schema = scrSchema;
export const scr_empty = scrEmpty;
export const scr_reference = scrReference;

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

    if (topic === undefined || topic === ''
        || h3Index === undefined || topic === '') {
        throw new Error(`Check parameters: ${topic} ${h3Index}`);
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
        .then(async (response) => await response.json());
}

/**
 * Request all services in the provided region.
 *
 * @param {string} topic
 * @param {string} token  security token for API access authorization
 * @returns {Promise<SCR[]>}  Array of the services in SCR format
 */
export function searchServicesForTenant(topic, token) {
    return request(`${SCD_URL}/tenant/${SCRS_PATH}/${topic}`, GET_METHOD, '', token)
        .then(async (response) => await response.json());
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
 * @param {File} file  The file with the contents in SCR format to post
 * @param {string} token  security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export async function postScrFile(topic, file, token) {
    let content;

    return getFileContent(file)
        .then(result => content = result)
        .then(() => validateScr(content, file.name))
        .then(async () => await postService(topic, content, token))
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
    return request(`${SCD_URL}/${SCRS_PATH}/${topic}/${id}`, DELETE_METHOD, '', token)
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

        let isValid = ajv.validate(scrSchema, parsed);

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
    [{"id": "a3683f12b334dea6", "type": "scr", "content": {"id": "111", "type": "3d", "title": "cat model", "keywords": ["cat"], "url": "https://www.example.com/cat.glb", "geopose": {"longitude": -97.7288818359375, "latitude": 30.286160447473897, "ellipsoidHeight": 78.34, "quaternion": [0.5, 0.5, 0.5, 0.5]}, "size": 100}, "tenant": "oscptest", "timestamp": "2020-09-24T01:51:42.489Z"}, {"id": "d44a6818c119b51e", "type": "scr", "content": {"id": "222", "type": "3d", "title": "dog model", "url": "https://www.example.com/dog.glb", "geopose": {"longitude": -97.7358341217041, "latitude": 30.28567869039136, "ellipsoidHeight": 78.34, "quaternion": [0.5, 0.5, 0.5, 0.5]}, "size": 100}, "tenant": "oscptest", "timestamp": "2020-09-24T01:51:59.066Z"}];

/** Local SCR record for testing */
export const localService =
    {"id": "a3683f12b334dea6", "type": "scr", "content": {"id": "111", "type": "3d", "title": "cat model", "keywords": ["cat"], "url": "https://www.example.com/cat.glb", "geopose": {"longitude": -97.7288818359375, "latitude": 30.286160447473897, "ellipsoidHeight": 78.34, "quaternion": [0.5, 0.5, 0.5, 0.5]}, "size": 100}, "tenant": "oscptest", "timestamp": "2020-09-24T01:51:42.489Z"};
