Simple library aiming to make access to the spatial service discovery as 
easy as possible. Currently verifying if it actually makes sense.


This module will very likely only run in a browser using rollup right now. 
Compatibility with other packagers and with Node on the server side is planned.


### Currently available functions are:
    getServicesAtLocation(countryCode, h3Index)
Requests services available around H3Index from the regional server for the provided 
countryCode

    function getServiceWithId(countryCode, id)
Requests service with provided id from the regional server for the provided countryCode

    function postService(countryCode, ssr, token)
Post a service to Spatial Services Discovery server of provided region

    function postSsrFile(countryCode, file, token)
Post the content of a .json file to Spatial Services Discovery server of provided region

    function putService(countryCode, ssr, id, token)
Send an edited SSR record to the server

    function validateSsr(ssr, fileName = '')
Validate the provided Spatial Services Record against the SSR json schema 

    function searchServicesForTenant(countryCode, token)
Request all services for the current tenant in the provided region

    function deleteWithId(countryCode, id, token)
Delete the record with the provided id and region


### Authentication

The spatial discovery services use auth0 for authentication. It uses the spa SDK from auth0. 
To use the authentication, create an .env file at the root of your project and add these 
values:

```
AUTH0_DOMAIN = 
AUTH0_CLIENTID = 
AUTH0_AUDIENCE = 
AUTH0_SCOPE = 
```

We use in rollup replace to replace the placeholders with the specific values during 
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


### New with this version:
- Added official geojson polygon schema to the SSR schema
- Delete function
-Put function


### More information about the discovery services used can be found here:

Spatial Service Discovery
- https://github.com/OpenArCloud/oscp-spatial-service-discovery/

Spatial Content Discovery
- https://github.com/OpenArCloud/oscp-spatial-content-discovery

Admin Sample, uses this module
- https://github.com/OpenArCloud/oscp-admin