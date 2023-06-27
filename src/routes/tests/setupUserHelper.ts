// test_helpers.ts
import request from 'supertest';
import Client from '../../database';
import app from '../../server'; // Your express app
import { User, UserStore } from '../../models/user';

export async function getTestToken(email: string, password: string): Promise<string> {
    const response = await request(app)
        .post('/api/users/authenticate')
        .send({ email, password });

    return response.body;
}

export async function setupTestUser(): Promise<string> {
    const store = new UserStore();

    const testUser: User = {
        email: 'test@example.com',
        password: 'testpassword',
        firstName: 'Test',
        lastName: 'User'
    };

    await store.create(testUser);

    return getTestToken(testUser.email, testUser.password!);
}

export async function deleteTestUser(): Promise<void>{
    const conn = await Client.connect();
    await conn.query(`DELETE FROM users WHERE email='test@example.com'`);  
    conn.release();    
}