import express, { Request, Response } from 'express';
import { Order, OrderStore } from '../../models/order';
import verifyAuthToken from '../../middleware/authentication';
import { AuthRequest, AuthUser } from '../../types';

const orders = express.Router();
const store = new OrderStore();

// create
orders.post('/', verifyAuthToken, async (req:AuthRequest, res: Response) => {
    const { id: user_id } = req.user as AuthUser;
    const order:Order = {
        user_id: user_id,
        status: 'active'
    };    
    try {   
        const storedOrder = await store.create(order);
        res.json(storedOrder);
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

// addProduct
orders.post('/:id/products', verifyAuthToken, async (req:AuthRequest, res: Response) => {
    const { id: user_id } = req.user as AuthUser;
    const order_id = parseInt(req.params.id);
    const product_id:number = req.body.product_id;
    const quantity:number = req.body.quantity;
    
    try {
        const order = await store.show(order_id);
        if (order.user_id !== user_id) {
            res.status(401);
            return res.json({ error: 'Access denied, order user is different from token.'});
        }

        const updatedOrder = await store.addProduct(quantity, order_id, product_id);
        res.json(updatedOrder); 
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

// update Order
orders.put('/:id', verifyAuthToken, async (req:AuthRequest, res: Response) => {
    const { id: user_id } = req.user as AuthUser;
    const order_id = parseInt(req.params.id);
    const order:Order = { 
        user_id: user_id,
        status: req.body.status
    }
    
    try {
        const checkOrder = await store.show(order_id);
        if (checkOrder.user_id !== user_id) {
            res.status(401);
            return res.json({ error: 'Access denied, order user is different from token.'});
        }

        const updatedOrder = await store.update(order_id, order);
        res.json(updatedOrder); 
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

// find current by user_id
orders.get('/current', verifyAuthToken, async (req: AuthRequest, res: Response) => {
    const { id: user_id } = req.user as AuthUser;
    try {
        const currentOrder = await store.findCurrentByUserId(user_id);
        res.json(currentOrder); 
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

// find complete by user_id
orders.get('/complete', verifyAuthToken, async (req: AuthRequest, res: Response) => {
    const { id: user_id } = req.user as AuthUser;
    try {
        const completeOrders = await store.findCompleteByUserId(user_id);
        res.json(completeOrders); 
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

export default orders;