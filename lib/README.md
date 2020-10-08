Simple library aiming to make access to the spatial content discovery as 
easy as possible. Currently verifying if it actually makes sense.


This module will very likely only run in a browser using rollup right now. 
Compatibility with other packagers and with Node on the server side is planned.


### New with this version:
- Implementing changes of SRC - url > refs[]


### Currently available functions are:
    getServicesAtLocation(topic, h3Index)
Requests services available around H3Index from the regional server for the provided 
countryCode

    function getServiceWithId(topic, id)
Requests service with provided id from the regional server for the provided countryCode

    function postService(topic, scr, token)
Post a service to Spatial Services Discovery server of provided region

    function postScrFile(topic, file, token)
Post the content of a .json file to Spatial Services Discovery server of provided region

    function putService(topic, scr, id, token)
Send an edited SSR record to the server

    function validateScr(scr, fileName = '')
Validate the provided Spatial Services Record against the SSR json schema 

    function searchServicesForTenant(topic, token)
Request all services for the current tenant in the provided region

    function deleteWithId(topic, id, token)
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