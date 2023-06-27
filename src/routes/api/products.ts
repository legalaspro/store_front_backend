import express, { Request, Response } from 'express';
import { Product, ProductStore } from '../../models/product';
import verifyAuthToken from '../../middleware/authentication';


const products = express.Router();
const store = new ProductStore();

//index
products.get('/', async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        const products = await store.index(category as string);
        res.json(products);
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

//show
products.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        const product = await store.show(id)
        res.json(product);
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});

//create
products.post('/', verifyAuthToken, async (req: Request, res: Response) => {
    const product: Product = {
        name: req.body.name,
        price: req.body.price,
        category: req.body.category
    }
    try {   
        const storedProduct = await store.create(product);
        res.json(storedProduct);
    } catch (err) {
        res.status(400)
        res.json({ error: (err as Error).toString() });
    }
});


export default products;