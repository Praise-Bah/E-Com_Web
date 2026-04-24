# Postman Collection

Import these files into Postman:

- `GlobalMart.postman_collection.json`
- `GlobalMart.local.postman_environment.json`

Use the `GlobalMart Local` environment for local development.

Suggested test order:

1. `Health`
2. `Test Routes -> Ping`
3. `Test Routes -> Echo`
4. `Test Routes -> Database Check`
5. `Auth -> Register` or `Auth -> Login`
6. `Test Routes -> Auth Check`
7. `Products`, `Cart`, `Orders`, `Addresses`

If you deploy the API, duplicate the environment and change `baseUrl` to your live `/api` URL.
