// (c) 2020 Open AR Cloud
// This code is licensed under MIT license (see LICENSE.md for details)

/**
 Main access point to the spatial discovery services of the Open Spatial Computing Platform.
 */

import scrSchema from './scr.schema.json';
import scrEmpty from './scr.empty.json';
import scrReference from './scr.reference.json';
import scrDefinition from './scr.definition.json';

import Ajv from 'ajv';
import addFormats from "ajv-formats"; // note: introduced in Ajv 8, see https://github.com/ajv-validator/ajv-formats

// Allows to return local JSON response for debugging
// When this is true, no server access is done, but a local result is returned instead.
export let local = false;

export const scr_schema = scrSchema;
export const scr_empty = scrEmpty;
export const scr_reference = scrReference;
export const scr_definition = scrDefinition;

const GET_METHOD = 'get';
const POST_METHOD = 'post';
const PUT_METHOD = 'put';
const DELETE_METHOD = 'delete';

const scrsPath = 'scrs'

/**
 * Requests the available contents in the provided location for a specific topic
 * The location to provide should be approximate, to prevent exposing exact client locations.
 *  
 * When the global variable `local` is set to true, no server access is done, but a local result is returned instead.
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic to search
 * @param {string} h3Index  Location based on the h3 [grid system]{https://eng.uber.com/h3/}
 * @param {string} keywords
 * @returns {Promise<SCR[]> | Promise<string>} Server response Promise
 */
export function getContentsAtLocation(url, topic, h3Index, keywords="") {
    if (local) {
        return Promise.resolve(localResults);
    }

    if (topic === undefined || topic === ''
        || h3Index === undefined || h3Index === '') {
        throw new Error(`Check parameters: ${topic} ${h3Index}`);
    }

    let keywordsQuery = `&keywords=${keywords}`;
    if (keywords === "") {
        keywordsQuery = ``;
    }

    return request(`${url}/${scrsPath}/${topic}?h3Index=${h3Index}` + keywordsQuery)
        .then(async (response) => await response.json())
}

/**
 * Requests the available contents in the provided location for a specific topic
 * Kept only for backwards compatibility
 * @deprecated Use getContentsAtLocation() instead
 */
export function getContentAtLocation(url, topic, h3Index, keywords="") {
    return getContentsAtLocation(url, topic, h3Index, keywords)
}

/**
 * Requests the content with the provided id from the provided topic
 *
 * When the global variable `local` is set to true, no server access is done, but a local result is returned instead.
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic to search
 * @param {string} id       ID of a SCR record stored on the server
 * @returns {Promise<SCR> | Promise<string>} Server response Promise
 */
export function getContentWithId(url, topic, id) {
    if (local) {
        return Promise.resolve(localResult);
    }

    if (id === undefined || id.length < 16) {
        throw new Error(`Check parameters: ${id}`);
    }

    return request(`${url}/${scrsPath}/${topic}/${id}`)
        .then(async (response) => await response.json());
}

/**
 * Request all content (for the tenant authorized by the token) in the provided topic.
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic to search
 * @param {string} token    Security token for API access authorization
 * @returns {Promise<SCR[]>}  Array of the content in SCR format
 */
export function searchContentsForTenant(url, topic, token) {
    return request(`${url}/tenant/${scrsPath}/${topic}`, GET_METHOD, '', token)
        .then(async (response) => await response.json());
}

/**
 * Post a single content record (SCR) to the server into the provided topic
 *
 * When the global variable `local` is set to true, no server access is done, but an immediate ok returned.
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic the new content should be added to
 * @param {string} scr      The content record to post
 * @param {string} token    Security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export function postContent(url, topic, scr, token) {
    if (local) {
        return Promise.resolve('OK');
    }

    if (scr === undefined || scr.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${scr}, ${token}`);
    }

    return request(`${url}/${scrsPath}/${topic}`, POST_METHOD, scr, token)
        .then(async (response) => await response.text())
}

/**
 * Post the content of a .json file to the server into the provided topic
 *
 * Reads the contents of the file, validates it against a json schema and posts it to the server.
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic the new content should be added to
 * @param {File} file       The file with the contents in SCR format to post
 * @param {string} token    Security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export async function postScrFile(url, topic, file, token) {
    let content;

    return getFileContent(file)
        .then(result => content = result)
        .then(() => validateScr(content, file.name))
        .then(async () => await postContent(url, topic, content, token))
}

/**
 * Put a single content record (SCR) to the server into the provided topic
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic to update
 * @param {string} scr      The content record to post
 * @param {string} id       ID of the edited record
 * @param {string} token    Security token for API access authorization
 * @returns {Promise<string>}  Server response Promise
 */
export async function putContent(url, topic, scr, id, token) {
    if (local) {
        return Promise.resolve('OK');
    }

    if (scr === undefined || scr.length === 0
        || id === undefined || id.length === 0
        || token === undefined || token.length === 0) {
        throw new Error(`Check parameters: ${scr}, ${id} ${token}`);
    }

    return request(`${url}/${scrsPath}/${topic}/${id}`, PUT_METHOD, scr, token)
        .then(async (response) => await response.text());
}

/**
 * Delete Content with provided ID from the provided topic
 *
 * @param {string} url      The url of the content discovery service to use
 * @param {string} topic    The topic to delete the content from
 * @param {string} id       ID of a SCR record stored for the topic
 * @param {string} token    Security token for API access authorization
 * @returns {Promise<*>}    Server response Promise
 */
export function deleteWithId(url, topic, id, token) {
    return request(`${url}/${scrsPath}/${topic}/${id}`, DELETE_METHOD, '', token)
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
        addFormats(ajv);
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
 * @param {string} url     The url to connect to
 * @param {string} method  The rest method to use
 * @param {string} body    The body payload if needed
 * @param {string} token   Security token for API access authorization
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
export const localResults =
    [{"id": "a3683f12b334dea6", "type": "scr", "content": {"id": "111", "type": "3d", "title": "cat model", "keywords": ["cat"], "url": "https://www.example.com/cat.glb", "geopose": { "position": {"lon": -97.7288818359375, "lat": 30.286160447473897, "h": 78.34}, "quaternion": {x:0.5, y:0.5, z:0.5, w:0.5}}, "size": 100}, "tenant": "oscptest", "timestamp": 202009}, {"id": "d44a6818c119b51e", "type": "scr", "content": {"id": "222", "type": "3d", "title": "dog model", "url": "https://www.example.com/dog.glb", "geopose": { "position": { "lon": -97.7358341217041, "lat": 30.28567869039136, "h": 78.34}, "quaternion": {x:0.5, y:0.5, z:0.5, w:0.5}}, "size": 100}, "tenant": "oscptest", "timestamp": 20200924}];

/** Local SCR record for testing */
export const localResult =
    {"id": "a3683f12b334dea6", "type": "scr", "content": {"id": "111", "type": "3d", "title": "cat model", "keywords": ["cat"], "url": "https://www.example.com/cat.glb", "geopose": { "position": {"lon": -97.7288818359375, "lat": 30.286160447473897, "h": 78.34}, "quaternion": {x:0.5, y:0.5, z:0.5, w:0.5}}, "size": 100}, "tenant": "oscptest", "timestamp": 20200924};
