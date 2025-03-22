import Express from 'express';
import { TenantController } from '../controllers/TenantController';
import { TenantService } from '../services/tenantService';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../entity/Tenant';
import logger from '../config/logger';

const router = Express.Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

router.post('/', (req, res, next) => tenantController.create(req, res, next));

export default router;
