import Client from '../database';
import bcrypt from 'bcrypt';

export type User = {
    id?: number,
    email: string,
    firstName: string,
    lastName: string,
    password?: string,
    password_digest?: string; 
}

const pepper:string = process.env.BCRYPT_PASSWORD  as string;
const saltRounds:string = process.env.SALT_ROUNDS as string;

function userFromRow(row:any): User {
    return {
        id: row.id,
        email: row.email,
        firstName: row.firstname,
        lastName: row.lastname,
    };
}

export class UserStore {
    async index(): Promise<User[]> {
        try {
            const conn = await Client.connect();
            const sql = "SELECT * FROM users";
            const result = await conn.query(sql);
            conn.release();
            return result.rows;
        } catch(err) {
            throw new Error(`Cannot get users: ${err}`);
        }
    }

    async show(id: number): Promise<User> {
        try {
            const conn = await Client.connect();
            const sql = "SELECT * FROM users WHERE id=$1";
            const result = await conn.query(sql, [id]);
            conn.release();
            return userFromRow(result.rows[0]);
        } catch(err){
            throw new Error(`Cannot get user with id=${id}: ${err}`);
        }
    }

    async create(u: User): Promise<User> {
        try {
            const conn = await Client.connect();
            const sql = 'INSERT INTO users (email, firstName, lastName, password_digest) VALUES($1, $2, $3, $4) RETURNING *'
            const hash = bcrypt.hashSync(
                u.password + pepper, 
                parseInt(saltRounds)
            );
            
            const result = await conn.query(sql,[u.email, u.firstName, u.lastName, hash]);
            const row = result.rows[0];
            conn.release()

            return userFromRow(row);
        } catch(err) {
            throw new Error(`Unable create user (${u.email}): ${err}`)
        }
    }

    async delete(id: number): Promise<User> {
        try {
            const conn = await Client.connect();
            const sql = 'DELETE FROM users WHERE id = ($1) RETURNING *'

            const result = await conn.query(sql, [id]);

            const user = result.rows[0];
            conn.release();
            return userFromRow(user);
        } catch(err) {
            throw new Error(`Unable delete user (${id}): ${err}`)
        }
    }

    async authenticate(email:string, password:string): Promise<User | null> {
        const conn = await Client.connect();
        const sql = 'SELECT * FROM users WHERE email=($1)';

        const result = await conn.query(sql, [email]);
        conn.release();
        // console.log(password+pepper);

        if (result.rows.length) {

            const row = result.rows[0];

            // console.log(row);

            if (bcrypt.compareSync(password+pepper, row.password_digest)) {
                return userFromRow(row);
            }
        }

        return null;
    }
}