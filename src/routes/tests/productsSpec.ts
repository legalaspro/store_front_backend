import supertest from 'supertest';
import Client from '../../database';
import app from '../../server';
import { Product, ProductStore } from '../../models/product';
import { setupTestUser, deleteTestUser } from './setupUserHelper';



const request = supertest(app);
const store = new ProductStore();

describe('Tests for users API', () => {
    let token: string;
    let createdProduct: Product;

    beforeAll(async () => {
        token = await setupTestUser();

        createdProduct = await store.create({
            name: 'test product',
            price: 100,
            category: 'test category'
        });
    });

    afterAll(async () => {
        // Delete Test User
        await deleteTestUser();

        const conn = await Client.connect();
        await conn.query(`DELETE FROM products`);  
        conn.release();      
    });


    describe('GET /api/products', () => {

        it('should return a list of products', async () => {
            const response = await request
                .get('/api/products');
    
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should return a list of products of specific category', async () => {
            // Let's create product with specific category
            const createResponse = await request
                .post('/api/products')
                .send({
                    name: 'Another test product 2',
                    price: 200,
                    category: 'Specific Category'
                })
                .set('Authorization', `Bearer ${token}`);
            
            expect(createResponse.status).toBe(200);
            expect(createResponse.body.category).toEqual('Specific Category');
            
            // query products with category 'Specific Category'
            const response = await request
                .get('/api/products')
                .query({
                    category: 'Specific Category'
                });
    
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toEqual(1);
            expect(response.body[0]).toEqual(jasmine.objectContaining({
                name:'Another test product 2',
                price: 200,
                category: 'Specific Category'
            }));
        });
    });

    describe('GET /api/products/:id', () => {

        it('should return a product by id', async () => {
            const response = await request
                .get(`/api/products/${createdProduct.id}`);
    
            expect(response.status).toBe(200);
            expect(response.body.name).toEqual('test product');
            expect(response.body.price).toEqual(100);
            expect(response.body.category).toEqual('test category');
        });
    });

    describe('POST /api/products', () => {

        it('should create a new product', async () => {
            const response = await request
                .post('/api/products')
                .send({
                    name: 'Another test product',
                    price: 200,
                    category: 'Another test category'
                })
                .set('Authorization', `Bearer ${token}`);
    
            expect(response.status).toBe(200);
            expect(response.body.name).toEqual('Another test product');
            expect(response.body.price).toEqual(200);
            expect(response.body.category).toEqual('Another test category');
        });
    })
});

