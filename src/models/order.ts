import Client from '../database';

type Product = {
    product_id: number;
    quantity: number;
}

export type Order = {
    id?: number,
    user_id: number,
    status: string
    products?: Product[]
};

export class OrderStore {

    async index():Promise<Order[]> {
        try {
            const conn = await Client.connect();
            const sql = 'SELECT * from orders'

            const result = await conn.query(sql);
            conn.release();
            return result.rows;
        } catch (err) {
            throw new Error(`Unable get orders: ${err}`)
        }
    }

    async show(id: number): Promise<Order> {
        try {
            const conn = await Client.connect();
            const sql = 'SELECT * FROM orders WHERE id=$1'
            const result = await conn.query(sql, [id]);
            conn.release();
            return result.rows[0];
        } catch(err) {
            throw new Error(`Cannot get order with ${id}: ${err}`);
        }
    }

    async create(order: Order): Promise<Order> {
        try {
            const conn = await Client.connect();
            
            if (order.status == 'active') {
                // Check if the user already has an active order
                const checkSql = 'SELECT * FROM orders WHERE user_id=$1 AND status=$2';
                const checkResult = await conn.query(checkSql, [order.user_id, 'active']);
                if (checkResult.rows.length > 0) {
                    throw new Error(`User with id=${order.user_id} already has an active order.`);
                }
            }

            const sql = 'INSERT INTO orders (status, user_id) VALUES ($1,$2) RETURNING *';
            const result = await conn.query(sql,[
                order.status,
                order.user_id
            ]);
            conn.release();
            return result.rows[0];
        } catch(err) {
            if(err instanceof Error) {
                throw err; // re-throw the original error if it is an instance of Error
            } else {
                throw new Error(`Cannot create order: ${err}`);
            }
        }
    }

    async update(id: number, order:Order): Promise<Order> {
        try {
            const conn = await Client.connect();

            // Check if the user already has an active order
            if (order.status === 'active') {
                const checkActiveOrderSql = 'SELECT * FROM orders WHERE user_id=$1 AND status=$2';
                const result = await conn.query(checkActiveOrderSql, [order.user_id, 'active']);

                if (result.rows.length > 0) {
                    throw new Error(`User with id=${order.user_id} already has an active order.`);
                }
            }

            const sql = 'UPDATE orders SET status=$1, user_id=$2 WHERE id=$3 RETURNING *';
            const result = await conn.query(sql, [
                order.status,
                order.user_id,
                id
            ]);
            conn.release();
            return result.rows[0];
        } catch(err) {
            if(err instanceof Error) {
                throw err; // re-throw the original error if it is an instance of Error
            } else {
                throw new Error(`Cannot update order with id ${id}: ${err}`);
            }
        }
    }

    async addProduct(quantity: number, orderId: number, productId: number):Promise<Order> {

        try {
            const conn = await Client.connect();
            
            // Check if the product with the specified ID exists
            const productSql = 'SELECT * FROM products WHERE id=$1';
            const productResult = await conn.query(productSql, [productId]);
            if (productResult.rows.length === 0) {
                throw new Error(`Product with id=${productId} does not exist`);
            }
            
            // get order to see if it is open
            const ordersql = 'SELECT * FROM orders WHERE id=($1)';
            const result = await conn.query(ordersql, [orderId])
            const order = result.rows[0]
            
            if (order.status !== "active") {
                throw new Error(`Could not add product ${productId} to order ${orderId} because order status is ${order.status}`)
            }
            
            // add product to the order
            const sql = 'INSERT INTO order_products (quantity, order_id, product_id) VALUES ($1,$2,$3) RETURNING *';
            const resultOrder = await conn.query(sql, [
                quantity,
                orderId,
                productId
            ]);
            conn.release();
            return resultOrder.rows[0]; 
        } catch(err) {
            if(err instanceof Error) {
                throw err; // re-throw the original error if it is an instance of Error
            } else {
                // throw a new Error only if the original error was not an instance of Error
                throw new Error(`Couldn't add product ${productId} to order ${orderId}: ${err}`);
            }
        }
    }

    async findCurrentByUserId(userId: number):Promise<Order | null>{
        try {
            const conn = await Client.connect();
            const sql = `
                SELECT o.id as order_id, p.id as product_id, op.quantity, o.user_id, o.status 
                FROM orders as o
                INNER JOIN order_products AS op ON o.id=op.order_id
                INNER JOIN products AS p ON op.product_id=p.id
                WHERE o.user_id=$1 AND o.status='active'
            `;
            const { rows } =  await conn.query(sql, [userId]);
            conn.release();

            //Aggregate the rows to create a single order object
            if (rows.length === 0) {
                return null
            }

            const order = rows.reduce((acc,row) => {
                if (!acc.id) {
                    acc.id = row.order_id;
                    acc.user_id = row.user_id;
                    acc.status = row.status;
                    acc.products = [];
                }

                acc.products.push({
                    product_id: row.product_id,
                    quantity: row.quantity
                });

                return acc;
            }, {} as Order);
            
            return order;
        } catch(err) {
            console.error(err);
            throw new Error(`Cannot get current order for user_id=${userId}: ${err}`);
        }
    }

    async findCompleteByUserId(userId:number):Promise<Order[]>{
        try {
            const conn = await Client.connect();
            const sql = `
                SELECT o.id as order_id, p.id as product_id, op.quantity, o.user_id, o.status 
                FROM orders as o
                INNER JOIN order_products AS op ON o.id=op.order_id
                INNER JOIN products AS p ON op.product_id=p.id
                WHERE o.user_id=$1 AND o.status='complete'
            `;
        
            const { rows } = await conn.query(sql, [userId]);
            conn.release();

            if (rows.length === 0) {
                return [];
            }

            const orders: Order[] = rows.reduce((acc, row) => {
                let order = acc.find((order:Order) => order.id === row.order_id);
        
                if (!order) {
                  order = {
                    id: row.order_id,
                    user_id: row.user_id,
                    status: row.status,
                    products: []
                  };
        
                  acc.push(order);
                }
        
                order.products.push({
                  product_id: row.product_id,
                  quantity: row.quantity
                });
        
                return acc;
              }, [] as Order[]);
        
            return orders;
        } catch(err) {
            console.error(err);
            throw new Error(`Cannot get current order for user_id=${userId}: ${err}`);
        }
    }
}