import app from '../../server';
import supertest from 'supertest';

const request = supertest(app);

describe('Tests for the main api', () => {
  it('gets the api endpoint', async () => {
    const response = await request.get('/api/');

    expect(response.status).toBe(200);
  });
});
