import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import bcrypt from 'bcrypt';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import { isJwt } from '../utils';

describe('POST /auth/login', () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should login the user AND should return statuscode 200', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret12',
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        password: hashedPassword,
        role: Roles.CUSTOMER,
      });

      // act
      const response = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: userData.password });

      // assert
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should return accessToken and refreshtoken', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret12',
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        password: hashedPassword,
        role: Roles.CUSTOMER,
      });

      // act
      const response = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: userData.password });

      // assert
      interface Headers {
        ['set-cookie']: string[];
      }

      let accessToken = null;
      let refreshToken = null;

      const cookies =
        (response.headers as unknown as Headers)['set-cookie'] || [];
      cookies.forEach((cookie) => {
        if (cookie.startsWith('accessToken')) {
          accessToken = cookie.split(';')[0].split('=')[1];
        }

        if (cookie.startsWith('refreshToken')) {
          refreshToken = cookie.split(';')[0].split('=')[1];
        }
      });

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();

      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });

    it('should return the 400 statusCode if email or password is wrong', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret12',
      };

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const userRepository = connection.getRepository(User);
      await userRepository.save({
        ...userData,
        password: hashedPassword,
        role: Roles.CUSTOMER,
      });

      // act
      const response = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });

      // assert
      expect(response.statusCode).toBe(400);
    });
  });
});
