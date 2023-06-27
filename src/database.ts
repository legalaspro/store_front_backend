import dotenv from 'dotenv';
import { Pool, types } from 'pg';

dotenv.config();

const { 
    ENV,
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
    POSTGRES_TEST_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD
} = process.env;


console.log(ENV);
const isTest:boolean = ENV === 'test';

const client = new Pool({
    host: POSTGRES_HOST,
    port: parseInt(POSTGRES_PORT!),
    database: isTest ? POSTGRES_TEST_DB : POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD
});


export default client;