import supertest from 'supertest';
import Client from '../../database';
import app from '../../server';
import { User, UserStore } from '../../models/user';


const request = supertest(app);
const store = new UserStore();

describe('Tests for users API', () => {
    let token: string;
    let userId: number;
    const user: User = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe'
    };
    

    beforeAll(async () => {
        // Create a user before running tests
        const createdUser = await store.create(user);
        userId = createdUser.id!;

        const response = await request
            .post('/api/users/authenticate')
            .send({email: user.email, password: user.password});
        
        expect(response.status).toBe(200);
        expect(response.body).toBeTruthy(); // a JWT
    
        token = response.body;
    });

    afterAll(async () => {
        await store.delete(userId); // delete the user created in the tests
    });

    describe('POST /api/users', () => {

        const newUser: User = {
            email: 'testNewUser@example.com',
            password: 'password',
            firstName: 'Michael',
            lastName: 'Jordan'
        };
        let newUserToken:string;

        it('creates a new user and returns a JWT', async () => {
            const response = await request
                .post('/api/users')
                .send(newUser);

            expect(response.status).toEqual(200);
            expect(typeof response.body).toEqual('string'); // a string JWT

            newUserToken = response.body;
        });

        it('should return 400 if user already exists', async () => {
            const response = await request
                .post('/api/users')
                .send(user);
            
            expect(response.status).toEqual(400);
        });

        afterAll(async() => {
            const conn = await Client.connect();
            await conn.query(`DELETE FROM users WHERE email='${newUser.email}'`);  
            conn.release();      
        });
    });

    describe('POST /api/users/authenticate', () => {

        const invalidUser: User = {
            email: 'invalid@example.com',
            password: 'password',
            firstName: 'John',
            lastName: 'Doe'
        };
        
        it('should authenticate a user and return a JWT', async () => {
            const response = await request
                .post('/api/users/authenticate')
                .send({email: user.email, password: user.password});
    
            expect(response.status).toBe(200);
            expect(response.body).toBeTruthy(); // a JWT
    
            token = response.body;
        });

        it('should not authenticate an invalid user', async () => {
            const response = await request
                .post('/api/users/authenticate')
                .send({email: invalidUser.email, password: invalidUser.password});
    
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/users', () => {

        it('should return a list of users', async () => {
            const response = await request
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`); // use the token received when the user was authenticated
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            
            const responseUserId =response.body.find(
                (u: User) => u.email === user.email).id;
            
            expect(responseUserId).toEqual(userId);
        });
    })

    describe('GET /api/users/:id', () => {

        it('should show the details of a user', async () => {
            const response = await request
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${token}`); // use the token received when the user was authenticated
    
            expect(response.status).toBe(200);
            expect(response.body.email).toEqual(user.email);
            expect(response.body.firstName).toEqual(user.firstName);
            expect(response.body.lastName).toEqual(user.lastName);
        });
    
        it('should not show details of a non-existent user', async () => {
            const response = await request
                .get(`/api/users/9999`)
                .set('Authorization', `Bearer ${token}`); // use the token received when the user was authenticated
    
            expect(response.status).toBe(400);
        });
    })

});
