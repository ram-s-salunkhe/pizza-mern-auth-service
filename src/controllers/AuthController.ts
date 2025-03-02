import { NextFunction, Response } from 'express';
import { AuthRequest, RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Logger } from 'winston';
import { validationResult } from 'express-validator';
import { TokenService } from '../services/TokenService';
import { JwtPayload } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { CredentialService } from '../services/credentialService';

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // validation
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { firstName, lastName, email, password } = req.body;

    this.logger.debug('new request to register a user', {
      firstName,
      lastName,
      email,
      password: '*****',
    });
    try {
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });
      this.logger.info('User has been registered', { id: user.id });

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      this.logger.info('access token generated', { id: user.id });

      // Persist the refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });
      this.logger.info('refresh token generated', { id: user.id });

      this.setCookieResponse(res, accessToken, refreshToken);
      // res.cookie('accessToken', accessToken, {
      //   domain: 'localhost',
      //   sameSite: 'strict',
      //   maxAge: 1000 * 60 * 60, // 1h
      //   httpOnly: true, // very important
      // });

      // res.cookie('refreshToken', refreshToken, {
      //   domain: 'localhost',
      //   sameSite: 'strict',
      //   maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      //   httpOnly: true, // very important
      // });

      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  setCookieResponse(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      domain: 'localhost',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60, // 1h
      httpOnly: true, // very important
    });

    res.cookie('refreshToken', refreshToken, {
      domain: 'localhost',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      httpOnly: true, // very important
    });
  }

  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    // validation
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }

    const { email, password } = req.body;

    this.logger.debug('new request to login a user', {
      email,
      password: '*****',
    });

    try {
      const user = await this.userService.findByEmail(email);

      if (!user) {
        const error = createHttpError(400, 'Email or Password does not match.');
        next(error);
        return;
      }

      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      );

      if (!passwordMatch) {
        const error = createHttpError(400, 'Email or Password does not match.');
        next(error);
        return;
      }

      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);
      this.logger.info('access token generated', { id: user.id });

      // Persist the refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });
      this.logger.info('refresh token generated', { id: user.id });

      this.setCookieResponse(res, accessToken, refreshToken);
      // res.cookie('accessToken', accessToken, {
      //   domain: 'localhost',
      //   sameSite: 'strict',
      //   maxAge: 1000 * 60 * 60, // 1h
      //   httpOnly: true, // very important
      // });

      // res.cookie('refreshToken', refreshToken, {
      //   domain: 'localhost',
      //   sameSite: 'strict',
      //   maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      //   httpOnly: true, // very important
      // });

      this.logger.info('User has been logged in', { id: user.id });

      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }

  async self(req: AuthRequest, res: Response) {
    const user = await this.userService.findById(Number(req.auth.sub));
    // token req.auth.id
    res.json({ ...user, password: undefined });
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload: JwtPayload = {
        sub: req.auth.sub,
        role: req.auth.role,
      };

      const accessToken = this.tokenService.generateAccessToken(payload);

      this.logger.info('access token generated', { id: req.auth.sub });

      const user = await this.userService.findById(Number(req.auth.sub));

      if (!user) {
        const error = createHttpError(
          400,
          'User with the token could not find',
        );
        next(error);
        return;
      }

      // Persist the refresh token
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      this.logger.info('refresh token generated', { id: req.auth.sub });

      // Delete old refresh token
      await this.tokenService.deleteRefreshToken(Number(req.auth.id));
      this.logger.info('refresh token deleted', { id: req.auth.sub });

      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });

      this.setCookieResponse(res, accessToken, refreshToken);

      // res.cookie('accessToken', accessToken, {
      //   domain: 'localhost',
      //   sameSite: 'strict',
      //   maxAge: 1000 * 60 * 60, // 1h
      //   httpOnly: true, // very important
      // });

      // res.cookie('refreshToken', refreshToken, {
      //   domain: 'localhost',
      //   sameSite: 'strict',
      //   maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
      //   httpOnly: true, // very important
      // });

      res.json({ id: user.id });
    } catch (err) {
      next(err);
      return;
    }
  }
}
