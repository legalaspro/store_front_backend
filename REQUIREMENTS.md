# API Requirements
The company stakeholders want to create an online storefront to showcase their great product ideas. Users need to be able to browse an index of all products, see the specifics of a single product, and add products to an order that they can view in a cart page. You have been tasked with building the API that will support this application, and your coworker is building the frontend.

These are the notes from a meeting with the frontend developer that describe what endpoints the API needs to supply, as well as data shapes the frontend and backend have agreed meet the requirements of the application. 

## API Endpoints
#### Products
- Index '/api/products' [GET]
- Show '/api/products/:id' [GET]
- Create [token required] '/api/products' [POST] 
- Products by category (args: product category) '/api/products?category=:category' [GET]

#### Users
- Index [token required] '/api/users' [GET]
- Show [token required] '/api/users/:id' [GET]
- Create '/api/users' [POST]
- Authenticate '/api/users/auth' [POST]

#### Orders
- Create Order [token required] '/api/orders' [POST]
- Add Product to Order [token required] '/api/orders/:id/products' [POST]
- Update Order [token required] '/api/orders/:id' [PUT]
- Current Order by user [token required] '/api/orders/current' [GET]
- Completed Orders by user [token required] '/api/orders/complete' [GET]

## Data Shapes
#### Product
- id
- name
- price
- category

#### User
- id
- email
- firstName
- lastName

#### Orders
- id
- user_id
- status (active or complete)
- products
- - product_id
- - quantity 

## Data Tables
#### Table Products
- id:number
- name:varchar(150)
- price:number
- category:varchar(100)

#### Table Users
- id:number
- email:varchar(255)
- firstName:varchar(100)
- lastName:varchar(100)
- password_digest:varchar

#### Table Orders
- id:number
- user_id:number[foreign key to users table]
- status:varchar(50) 

#### Table Order_products
- id:number
- order_id:number[foreign key to orders table]
- product_id:number[foreign key to products table]
- quantity:number