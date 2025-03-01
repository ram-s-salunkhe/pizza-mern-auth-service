import express, {
  NextFunction,
  Request,
  Response,
  RequestHandler,
} from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';
import registerValidator from '../validators/register-validator';
import loginValidator from '../validators/login-validator';
import { TokenService } from '../services/TokenService';
import { RefreshToken } from '../entity/RefreshToken';
import { CredentialService } from '../services/credentialService';
import authenticate from '../middlewares/authenticate';
import { AuthRequest } from '../types';
import validateRefreshToken from '../middlewares/validateRefreshToken';

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const tokenService = new TokenService(refreshTokenRepository);
const credentialService = new CredentialService();

const authController = new AuthController(
  userService,
  logger,
  tokenService,
  credentialService,
);

router.post('/register', registerValidator, (async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await authController.register(req, res, next);
}) as RequestHandler);

router.post('/login', loginValidator, (async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await authController.login(req, res, next);
}) as RequestHandler);

router.get('/self', authenticate, (async (req: Request, res: Response) => {
  await authController.self(req as AuthRequest, res);
}) as RequestHandler);

router.post(
  '/refresh',
  validateRefreshToken,
  (req: Request, res: Response, next: NextFunction) => {
    void authController.refresh(req as AuthRequest, res, next);
  },
);

export default router;
