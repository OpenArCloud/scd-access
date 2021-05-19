Simple library aiming to make access to the spatial content discovery as 
easy as possible. Currently verifying if it actually makes sense.


This module will very likely only run in a browser using rollup right now. 
Compatibility with other packagers and with Node on the server side is planned.


### New with this version:
- **Breaking changes**
- Replace `service` in function names with `content`
- Add URL of Content Discovery to use as a parameter to the functions
- Rename `localServices` and `localService` to `localResults` and `localResult`
- Change constant `SCR_URL` to variable `scrUrl` and export it. Allows accessing 
  different content discovery services 


### Currently available functions are:
    getContentAtLocation(url, topic, h3Index)
Requests content available around H3Index from the regional server for the provided 
countryCode

    function getContentWithId(url, topic, id)
Requests content with provided id from the regional server for the provided countryCode

    function postContent(url, topic, scr, token)
Post a content to Spatial Content Discovery server of provided region

    function postScrFile(url, topic, file, token)
Post the content of a .json file to Spatial Content Discovery server of provided region

    function putContent(url, topic, scr, id, token)
Send an edited SCR record to the server

    function validateScr(scr, fileName = '')
Validate the provided Spatial Content Record against the SCR json schema 

    function searchContentForTenant(url, topic, token)
Request all content for the current tenant in the provided region

    function deleteWithId(url, topic, id, token)
Delete the record with the provided id and region


### Authentication

The spatial discovery services use auth0 for authentication. It uses the spa SDK from auth0. 
To use the authentication, create an .env file at the root of your project and add these 
values:

```
AUTH0_SCD_DOMAIN = 
AUTH0_SCD_CLIENTID = 
AUTH0_SCD_AUDIENCE = 
AUTH0_SCD_SCOPE = 
```

We use rollup replace to replace the placeholders with the specific values during 
packaging of the browser app.


    function init()
Instantiate and initialize the auth0 object, used for login/logout and api access

    function login()
    function logout()

    getToken()
Returns the auth0 access token

    authenticated
true when client is logged in

    user
The user record from auth0


### More information about the discovery services used can be found here:

Spatial Service Discovery
- https://github.com/OpenArCloud/oscp-spatial-service-discovery/

Spatial Content Discovery
- https://github.com/OpenArCloud/oscp-spatial-content-discovery

Admin Sample, uses this module
- https://github.com/OpenArCloud/oscp-admin
