import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import request from 'supertest';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenant';

describe('POST /tenants', () => {
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
    it('should return 201 satus code', async () => {
      const tenantData = {
        name: 'tenant name',
        address: 'tenant address',
      };
      const response = await request(app).post('/tenants').send(tenantData);

      expect(response.statusCode).toBe(201);
    });

    it('should create a tenant in the database', async () => {
      const tenantData = {
        name: 'tenant name',
        address: 'tenant address',
      };

      await request(app).post('/tenants').send(tenantData);

      const tenantRepository = connection.getRepository(Tenant);
      const tenants = await tenantRepository.find();

      expect(tenants).toHaveLength(1);
      expect(tenants[0].name).toBe(tenantData.name);
      expect(tenants[0].address).toBe(tenantData.address);
    });
  });
});
