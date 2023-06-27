import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types';


const verifyAuthToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization as string;
        const token = authorizationHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string) as JwtPayload;

        req.user = decoded.user as AuthUser;

        next()
    } catch (error) {
        res.status(401)
        res.json('Access denied, invalid token')
    }
}

export default verifyAuthToken;
