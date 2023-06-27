import express, { Request, Response } from 'express';
import { User, UserStore } from '../../models/user';
import jwt from 'jsonwebtoken';
import verifyAuthToken from '../../middleware/authentication';

const users = express.Router();
const store = new UserStore();

const tokenSecret = process.env.TOKEN_SECRET as string;

//index
users.get('/', verifyAuthToken, async (req: Request, res: Response) => {
    try {
        const users = await store.index();
        res.json(users);
    } catch (err) {
        res.status(400)
        res.json(err)
    }
});

//show
users.get('/:id', verifyAuthToken, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        const user = await store.show(id)
        res.json(user);
    } catch (err) {
        res.status(400)
        res.json(err)
    }
});

//create
users.post('/', async (req: Request, res: Response) => {
    const user: User = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    }
    try {   
        const storedUser = await store.create(user);

        const token = jwt.sign({user: storedUser}, tokenSecret)
        
        res.json(token);
    } catch (err) {
        res.status(400)
        res.json(err);
    }
});

//authenticate
users.post('/authenticate', async (req:Request, res:Response) => {
    const email = req.body.email;
    const password = req.body.password;

    const storedUser = await store.authenticate(email, password);
       
    if (storedUser) {
        const token = jwt.sign({user: storedUser}, tokenSecret)
        res.json(token);
    } else {
        res.status(401);
        res.json({ error: "Wrong email or password." });
    }
});

export default users;
