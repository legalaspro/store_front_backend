import supertest from 'supertest';
import Client from '../../database';
import app from '../../server';
import { OrderStore } from '../../models/order';
import { Product } from '../../models/product';
import { setupTestUser, deleteTestUser } from './setupUserHelper';


const request = supertest(app);
const store = new OrderStore();

describe('Tests for orders API', () => {
    let token: string;
    let testProduct: Product;
    const orderProductName = "Test Order Product";

    beforeAll(async () => {
      token = await setupTestUser();
      const conn = await Client.connect();
      await conn.query(`INSERT INTO products (name, price, category) 
          VALUES ('${orderProductName}', 1000, 'TestCategory') RETURNING *`);
      const productResult = await conn.query(`SELECT * FROM products WHERE name='${orderProductName}'`);
      testProduct = productResult.rows[0];
      conn.release();
    });
    
    afterAll(async () => {
        const conn = await Client.connect();
        // Delete the user
        await conn.query(`DELETE FROM users`);
        // Delete the product
        await conn.query(`DELETE FROM products`);
        conn.release();
    });

    afterEach(async () => {
        const conn = await Client.connect();
        // Delete all orders created during tests
        await conn.query(`DELETE FROM orders`);
        conn.release();
    })

    // Create a new order
    describe('POST /api/orders', () => {

        it('should create a new order for the authenticated user', async () => {
            const response = await request
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send();
        
            expect(response.status).toBe(200);
            expect(response.body.user_id).toBeDefined();
            expect(response.body.status).toEqual('active');
        });
    });

    // Add product to the order
    describe('POST /api/orders/:id/products', () => {
        it('should add a product to an order', async () => {
            // First, create a new order
            const orderResponse = await request
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send();
      
            const orderId = orderResponse.body.id;

            const response = await request
                .post(`/api/orders/${orderId}/products`)
                .set('Authorization', `Bearer ${token}`)
                .send({ product_id: testProduct.id!, quantity: 2 });
        
            expect(response.status).toBe(200);
            expect(response.body.order_id).toEqual(orderId);
            expect(response.body.product_id).toEqual(testProduct.id!);
            expect(response.body.quantity).toEqual(2);
        });
    });

    // Update order
    describe('PUT /api/orders/:id', () => {
        it('should update an order status', async () => {
            // First, create a new order
            const orderResponse = await request
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send();
  
            const orderId = orderResponse.body.id;
  
            const response = await request
                .put(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'complete' });
  
            expect(response.status).toBe(200);
            expect(response.body.status).toEqual('complete');
        });
    });
  

   // Current order by user id
   describe('GET /api/orders/current', () => {
    it('should get the current order for a user', async () => {
        // First, create a new order
        const orderResponse = await request
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send();

        const orderId = orderResponse.body.id;

        await request
            .post(`/api/orders/${orderId}/products`)
            .set('Authorization', `Bearer ${token}`)
            .send({ product_id: testProduct.id!, quantity: 2 });

        const response = await request
            .get('/api/orders/current')
            .set('Authorization', `Bearer ${token}`)
            .send();
        
        expect(response.status).toBe(200);
        expect(response.body.status).toEqual('active');
        expect(response.body.id).toEqual(orderId);
        expect(response.body.user_id).toBeDefined();
        expect(response.body.products.length).toEqual(1);
        expect(response.body.products[0]).toEqual(jasmine.objectContaining({
            product_id: testProduct.id!, 
            quantity: 2
        }));
    });
  });

  // Completed orders by user id
  describe('GET /complete', () => {
    it('should get the completed orders for a user', async () => {
        // First, create a new order and set it to complete
        const orderResponse = await request
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send();
        
        const orderId = orderResponse.body.id;
        
        await request
            .post(`/api/orders/${orderId}/products`)
            .set('Authorization', `Bearer ${token}`)
            .send({ product_id: testProduct.id!, quantity: 2 });
        await request
            .put(`/api/orders/${orderId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'complete' });
  
        const response = await request
            .get('/api/orders/complete')
            .set('Authorization', `Bearer ${token}`)
            .send();
  
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toEqual(1);
        expect(response.body[0]).toEqual(jasmine.objectContaining({
            id: orderId,
            status: 'complete',
            products: [ 
                {
                    product_id: testProduct.id!, 
                    quantity: 2
                }
            ]
        }));
    });
  });  
});

