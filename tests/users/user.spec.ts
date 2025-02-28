import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import createJWKSMock from 'mock-jwks';
import app from '../../src/app';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';
import bcrypt from 'bcrypt';
// import { User } from '../../src/entity/User';
// import { Roles } from '../../src/constants';
// import { isJwt } from '../utils';

describe('GET /auth/self', () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  beforeAll(async () => {
    jwks = createJWKSMock('http://localhost:5501');
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterEach(() => {
    jwks.stop();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should return the 200 status code', async () => {
      const accessToken = jwks.token({ sub: '1', role: Roles.CUSTOMER });

      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });

    it('should return the user data', async () => {
      // Register User
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret12',
      };

      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      }); // why we are not sending hashpassword here

      // Generate Token
      const accessToken = jwks.token({ sub: String(data.id), role: data.role }); // why we name key as sub

      // Add token to cookie
      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken};`])
        .send();

      // Assert
      // check if user id matches with registered user
      expect((response.body as Record<string, string>).id).toBe(data.id);
    });

    it('should not return the password field', async () => {
      // Register User
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret12',
      };

      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
        role: Roles.CUSTOMER,
      }); // why we are not sending hashpassword here

      // Generate Token
      const accessToken = jwks.token({ sub: String(data.id), role: data.role }); // why we name key as sub

      // Add token to cookie
      const response = await request(app)
        .get('/auth/self')
        .set('Cookie', [`accessToken=${accessToken};`])
        .send();

      // Assert
      // check if user id matches with registered user
      console.log('body >>>', response.body);
      expect(response.body as Record<string, string>).not.toHaveProperty(
        'password',
      );
    });
  });
});
