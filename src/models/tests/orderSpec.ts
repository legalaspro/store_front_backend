import Client from '../../database';
import bcrypt from 'bcrypt';
import { Order, OrderStore } from "../order";
import { User } from '../user';
import { Product } from '../product';

const pepper:string = process.env.BCRYPT_PASSWORD  as string;
const saltRounds:string = process.env.SALT_ROUNDS as string;

describe('Order Model', () => {

    const store = new OrderStore();
    const emailAddress = "testOrder@example.com";
    const orderProductName = "Test Order Product";
    let testUser:User;
    let testProduct:Product;
    let testOrder:Order;

    beforeAll(async () => { 
        
        // Setup the product and user directly using SQL queries
        const conn = await Client.connect();
        await conn.query(`INSERT INTO products (name, price, category) 
            VALUES ('${orderProductName}', 1000, 'TestCategory') RETURNING *`);
        
         // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('password' + pepper, saltRounds);

        await conn.query(`INSERT INTO users (email, firstName, lastName, password_digest) 
            VALUES ('${emailAddress}', 'Test', 'User', '${hashedPassword}') RETURNING *`);

        const productResult = await conn.query(`SELECT * FROM products WHERE name='${orderProductName}'`);
        testProduct = productResult.rows[0];

        const userResult = await conn.query(`SELECT * FROM users WHERE email='${emailAddress}'`);
        testUser = userResult.rows[0];

        conn.release();
    });

    afterAll(async () => {
        const conn = await Client.connect();
        // Delete all orders associated with the user
        await conn.query(`DELETE FROM orders WHERE user_id=${testUser.id}`);
        // Delete the user
        await conn.query(`DELETE FROM users WHERE id=${testUser.id}`);
        // Delete the product
        await conn.query(`DELETE FROM products WHERE id=${testProduct.id}`);
        conn.release();
    });

    // Define the tests that do not depend on the testOrder being active
    describe('without active order', () => {
        beforeEach(async () => {
            testOrder = await store.create({
                status: "complete",
                user_id: testUser.id!
            });
        });
        
        afterEach(async () => {
            const conn = await Client.connect();
            // Delete all orders associated with the user
            await conn.query(`DELETE FROM orders WHERE user_id=${testUser.id}`);
            conn.release();
        });

        // The tests related to non-active orders go here...
        it('should fail to add a product to a non-active order', async () => {    
            try {
                await store.addProduct(10, testOrder.id!, testProduct.id!);
                fail('Should have thrown an error');
            } catch (err) {
                const error = err as Error;
                expect(error.message).toEqual(`Could not add product ${testProduct.id} to order ${testOrder.id!} because order status is ${testOrder.status}`);
            }
        });
    });

    // Define the tests that require the testOrder to be active
    describe('with active order', () => {
        beforeEach(async () => {
            testOrder = await store.create({
                status: "active",
                user_id: testUser.id!
            });
        });

        afterEach(async () => {
            const conn = await Client.connect();
            // Delete all orders associated with the user
            await conn.query(`DELETE FROM orders WHERE user_id=${testUser.id}`);
            conn.release();
        });

        it('should show details of an order', async () => {
            const result = await store.show(testOrder.id!);
            expect(result).toEqual(testOrder);
        });

        // The tests related to active orders go here...
        it('should add a product to an order', async () => {
            const result = await store.addProduct(2, testOrder.id!, testProduct.id!);
            expect(result).toEqual(jasmine.objectContaining({
                quantity: 2,
                order_id: testOrder.id,
                product_id: testProduct.id
            }));
        });

        it('should not create a second active order for the same user', async () => {
            try {
                await store.create({
                    status: 'active',
                    user_id: testUser.id!
                });
            } catch (err) {
                expect(err).toEqual(new Error(`User with id=${testUser.id} already has an active order.`));
            }
        });

        it('should fail to add a product that does not exist', async () => {
            const nonExistentProductId = 99999; // Some id that does not exist
    
            try {
                await store.addProduct(10, testOrder.id!, nonExistentProductId);
                fail('Should have thrown an error');
            } catch (err) {
                const error = err as Error;
                expect(error.message).toEqual(`Product with id=${nonExistentProductId} does not exist`);
            }
        });

        it('should not update the order to active status if the user already has an active order', async () => {
            // And another order from the same user
            const otherOrder = await store.create({
                status: 'complete',
                user_id: testUser.id!,
            });
        
            // When attempting to update the other order to active status
            let error;
            try {
                await store.update(otherOrder.id!, {
                    status: 'active',
                    user_id: testUser.id!,
                });
            } catch (e) {
                error = e;
            }
        
            // Then an error should be thrown
            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe(`User with id=${testUser.id} already has an active order.`);
        });

        it('should return the current active order of a user', async () => {
            await store.addProduct(2, testOrder.id!, testProduct.id!);
            const result = await store.findCurrentByUserId(testUser.id!);
            expect(result).toBeDefined();
            expect(result).toEqual(jasmine.objectContaining({
                id: testOrder.id,
                user_id: testUser.id,
                status: 'active',
                products: [{product_id: testProduct.id, quantity: 2}]
            }));
        });

        it('should return all completed orders of a user', async () => {
            await store.addProduct(2, testOrder.id!, testProduct.id!);
            await store.update(testOrder.id!, {
                status: 'complete',
                user_id: testUser.id!,
            });
            const result = await store.findCompleteByUserId(testUser.id!);
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result[0]).toEqual(jasmine.objectContaining({
                id: testOrder.id,
                user_id: testUser.id,
                status: 'complete',
                products:  [{product_id: testProduct.id, quantity: 2}]
            }));
        });
    });
    
    
    // Define the tests that do not depend on the state of the testOrder
    describe('independent tests', () => {
        // The tests that are independent of the state of the testOrder go here...
        it('should have an index method', () => {
            expect(store.index).toBeDefined();
        });
        it('should have a show method', () => {
            expect(store.show).toBeDefined();
        })
        it('should have a create method', () => {
            expect(store.create).toBeDefined();
        })
        it('should have an addProduct method', () => {
            expect(store.addProduct).toBeDefined();
        })
        it('should have an updateOrderStatus method', () => {
            expect(store.update).toBeDefined();
        })
        it('should have an findCurrentByUserId method', () => {
            expect(store.findCurrentByUserId).toBeDefined();
        })
        it('should have an findCompleteByUserId method', () => {
            expect(store.findCompleteByUserId).toBeDefined();
        })
    
        it('should have a method to retrieve orders', async () => {
            const result = await store.index();
            // expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual(jasmine.any(Array));
        });
    });
    
})