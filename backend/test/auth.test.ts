import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../src/common/middleware/errorHandler';
import authRoutes from '../src/modules/auth/auth.routes';
import { prisma } from '../src/prisma/client';
import { hashPassword } from '../src/common/utils/password';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Auth Module', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '+963999999999', password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '+963999000000', password: 'SecureAdminPassword123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register/merchant', () => {
    it('should register a new merchant with store', async () => {
      const phone = `+963998${Date.now().toString().slice(-6)}`;
      const email = `test${Date.now()}@merchant.com`;

      const res = await request(app)
        .post('/api/auth/register/merchant')
        .send({
          name: 'تاجر اختبار',
          phone,
          email,
          storeName: 'متجر اختبار',
          storeDescription: 'وصف متجر اختبار',
          storeAddress: 'عنوان اختبار',
          storePhone: '+963161111111',
          password: 'MerchantPass123!',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('تاجر اختبار');
    });

    it('should return 400 for invalid phone', async () => {
      const res = await request(app)
        .post('/api/auth/register/merchant')
        .send({
          name: 'تاجر اختبار',
          phone: 'invalid',
          storeName: 'متجر اختبار',
          storeAddress: 'عنوان',
          storePhone: '+963161111111',
          password: 'MerchantPass123!',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate phone', async () => {
      const phone = `+963998${Date.now().toString().slice(-6)}`;

      await request(app)
        .post('/api/auth/register/merchant')
        .send({
          name: 'تاجر اختبار 2',
          phone,
          storeName: 'متجر اختبار 2',
          storeAddress: 'عنوان',
          storePhone: '+963161111111',
          password: 'MerchantPass123!',
        });

      const res = await request(app)
        .post('/api/auth/register/merchant')
        .send({
          name: 'تاجر اختبار 3',
          phone,
          storeName: 'متجر اختبار 3',
          storeAddress: 'عنوان',
          storePhone: '+963161111111',
          password: 'MerchantPass123!',
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_ENTRY');
    });
  });
});