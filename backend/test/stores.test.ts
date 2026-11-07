import request from 'supertest';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../src/common/middleware/errorHandler';
import storeRoutes from '../src/modules/stores/stores.routes';
import authRoutes from '../src/modules/auth/auth.routes';
import { prisma } from '../src/prisma/client';
import { hashPassword } from '../src/common/utils/password';
import { generateAccessToken } from '../src/common/utils/jwt';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

describe('Stores Module', () => {
  let adminToken: string;
  let merchantToken: string;
  let merchantId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as admin
    const adminUser = await prisma.user.findUnique({ where: { phone: '+963999000001' } });
    if (adminUser) {
      adminToken = generateAccessToken({ userId: adminUser.id, phone: adminUser.phone, role: adminUser.role });
    }

    // Login as merchant
    const merchantUser = await prisma.user.findFirst({ where: { role: 'MERCHANT' } });
    if (merchantUser) {
      merchantId = merchantUser.id;
      merchantToken = generateAccessToken({ userId: merchantUser.id, phone: merchantUser.phone, role: merchantUser.role });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/stores', () => {
    it('should return stores for admin', async () => {
      const res = await request(app)
        .get('/api/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 for non-admin', async () => {
      await request(app)
        .get('/api/stores')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(403);
    });
  });

  describe('GET /api/stores/me', () => {
    it('should return merchant store', async () => {
      const res = await request(app)
        .get('/api/stores/me')
        .set('Authorization', `Bearer ${merchantToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.ownerUserId).toBe(merchantId);
    });
  });

  describe('PATCH /api/stores/:id/approve', () => {
    it('should approve store as admin', async () => {
      const store = await prisma.store.findFirst({ where: { status: 'PENDING' } });
      if (!store) return;

      const res = await request(app)
        .patch(`/api/stores/${store.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'approve' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('should return 403 for merchant', async () => {
      const store = await prisma.store.findFirst({ where: { status: 'ACTIVE' } });
      if (!store) return;

      await request(app)
        .patch(`/api/stores/${store.id}/approve`)
        .set('Authorization', `Bearer ${merchantToken}`)
        .send({ action: 'suspend' })
        .expect(403);
    });
  });
});