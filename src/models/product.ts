import Client from '../database';

export type Product = {
    id?: number,
    name: string,
    price: number,
    category: string
}

export class ProductStore {
    async index(category?: string): Promise<Product[]> {
        try {
            const conn = await Client.connect();
            let result;
            if (category) {
                const sql = "SELECT * FROM products WHERE category=$1";
                result = await conn.query(sql, [category]);
            } else {
                const sql = "SELECT * FROM products";
                result = await conn.query(sql);
            }
            conn.release();
            return result.rows;
        } catch(err) {
            console.log(err)
            throw new Error(`Cannot get products: ${err}`);
        }
    }

    async show(id: number): Promise<Product> {
        try {
            const conn = await Client.connect();
            const sql = "SELECT * FROM products WHERE id=$1";
            const result = await conn.query(sql, [id]);
            conn.release();
            return result.rows[0];
        } catch(err){
            console.log(err)
            throw new Error(`Cannot get product with id=${id}: ${err}`);
        }
    }

    async create(product: Product): Promise<Product> {
        try {
            const conn = await Client.connect();
            const sql = "INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *";
            const result = await conn.query(sql, [
                product.name,
                product.price,
                product.category
            ]);
            conn.release();
            return result.rows[0];
        } catch(err) {
            console.log(err)
            throw new Error(`Cannot create product: ${err}`);
        }
    }

    async delete(id: number): Promise<Product> {
        try {
            const conn = await Client.connect();
            const sql = 'DELETE FROM products WHERE id = $1 RETURNING *'
            const result = await conn.query(sql, [id]);
            conn.release();
            return result.rows[0];
        } catch(err) {
            console.log(err)
            throw new Error(`Cannot delete product with id ${id}: ${err}`);
        }
    }
}