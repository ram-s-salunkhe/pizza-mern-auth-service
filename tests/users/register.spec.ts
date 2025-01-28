import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
import { AppDataSource } from '../../src/config/data-source';
import { Roles } from '../../src/constants';
// import { truncateTables } from '../utils';

describe('POST /auth/register', () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    // database truncate
    // await truncateTables(connection);
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe('Given all fields', () => {
    it('should retuen the 201 status code', async () => {
      // AAA - 1) arrange 2) act 3) assert
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };
      // act
      const response = await request(app).post('/auth/register').send(userData);
      // assert
      expect(response.statusCode).toBe(201);
    });

    it('Should return valid json respionse', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };
      // act
      const response = await request(app).post('/auth/register').send(userData);

      // assert
      expect(
        (response.headers as Record<string, string>)['content-type'],
      ).toEqual(expect.stringContaining('json'));
    });

    it('Should persist the user in the database', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };
      // act
      await request(app).post('/auth/register').send(userData);

      // assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
      expect(users[0].email).toBe(userData.email);
    });

    it('should return an id of the created user', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };

      //act
      const response = await request(app).post('/auth/register').send(userData);

      // assert
      expect(response.body).toHaveProperty('id');
    });

    it('should assign a customer role', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };

      //act
      await request(app).post('/auth/register').send(userData);

      // assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users[0]).toHaveProperty('role');
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });

    it('should store the hashed password in the database', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };

      //act
      await request(app).post('/auth/register').send(userData);

      //assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
    });

    it('should return 400 status code if email is already exists', async () => {
      // arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'Salunkhe',
        email: 'ramsalunkhe6@gmail.com',
        password: 'secret',
      };

      const userRepositort = connection.getRepository(User);
      await userRepositort.save({ ...userData, role: Roles.CUSTOMER });

      //act
      const response = await request(app).post('/auth/register').send(userData);
      const users = await userRepositort.find();

      // assert
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });
  });

  describe('Fields are missing', () => {
    it('should return 400 status code if email field is missing', async () => {
      // Arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'S',
        email: '',
        password: 'secret',
      };
      // Act
      const response = await request(app).post('/auth/register').send(userData);

      // Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
  });

  describe('Fields are not in proper format', () => {
    it('should trim the email field', async () => {
      // Arrange
      const userData = {
        firstName: 'Ram',
        lastName: 'S',
        email: ' ram@gmail.com ',
        password: 'secret',
      };

      // Act
      await request(app).post('/auth/register').send(userData);

      // Assert
      const userRepositort = connection.getRepository(User);
      const users = await userRepositort.find();
      const user = users[0];
      expect(user.email).toBe('ram@gmail.com');
    });
  });
});
