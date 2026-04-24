# Teacher Demo Guide

Use this guide when showing the project to your teacher.

## What To Show

1. The API endpoints in `server/index.js`
2. The Postman collection
3. The database connection working
4. One protected route using the JWT token

## API Endpoints To Mention

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/:id/reviews`
- `POST /api/products/:id/reviews`
- `GET /api/categories`
- `GET /api/cart`
- `POST /api/cart/sync`
- `GET /api/wishlist`
- `POST /api/wishlist`
- `DELETE /api/wishlist/:productId`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `GET /api/addresses`
- `POST /api/addresses`
- `GET /api/admin/stats`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id/status`
- `GET /api/admin/categories`

## Demo Order In Postman

1. Start the API and MySQL database locally.
2. Import the Postman collection and environment.
3. Select the `GlobalMart Local` environment.
4. Run `Health`.
5. Run `Products -> List Products`.
6. Run `Categories -> List Categories`.
7. Run `Auth -> Register` or `Auth -> Login`.
8. Run `Auth -> Me`.
9. Run `Cart -> Get Cart` or `Cart -> Sync Cart`.
10. Run `Reviews -> Get Reviews` or `Reviews -> Add Review`.
11. Run `Wishlist -> Get Wishlist` or `Wishlist -> Add To Wishlist`.
12. Run `Orders -> List Orders` or `Orders -> Create Order`.
13. Run `Addresses -> List Addresses` or `Addresses -> Create Address`.
14. Run `Auth -> Admin Login`, then `Admin -> Stats` or `Admin -> List Products`.

## What The Teacher Will See

- `Health` proves the server is running.
- `Products` and `Categories` prove the API is reading from MySQL.
- `Register/Login` proves authentication works and writes to the database.
- `Auth -> Me` proves the JWT token is valid.
- `Reviews` and `Wishlist` prove user-specific protected routes are connected to the database.
- `Orders`, `Addresses`, and `Admin` prove the protected routes are connected to the database.

## Database Proof

The database is proven through real API requests:

- `GET /api/products` reads product rows from MySQL
- `GET /api/categories` reads category rows from MySQL
- `POST /api/auth/register` writes a user into MySQL
- `GET /api/auth/me` reads that user back
- `GET /api/orders` and `GET /api/addresses` read protected data from MySQL

## Helpful Note

If your teacher asks where the endpoints are written, open:

- `server/index.js`

If your teacher asks where the database structure is written, open:

- `db/init.sql`
