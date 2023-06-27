import express from 'express';
import products from './api/products';
import users from './api/users';
import orders from './api/orders';

const routes = express.Router();

routes.get('/', (req: express.Request, res: express.Response): void => {
  res.send('main api route');
});

routes.use('/users', users);
routes.use('/orders', orders);
routes.use('/products', products)

export default routes;
