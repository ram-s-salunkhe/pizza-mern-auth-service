import request from 'supertest';
import app from '../../src/app';

describe('POST /auth/register', () => {
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
    });
  });

  describe('Fields are missing', () => {});
});
