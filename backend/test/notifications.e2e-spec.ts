import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('DELETE FROM notification_settings');
      await dataSource.query('DELETE FROM user');
    }

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'notifications@example.com',
        password: 'password123',
        role: 'user',
      });

    userId = registerResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'notifications@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;
  });

  describe('/notifications/settings (GET)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/notifications/settings')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/notifications/settings')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should return empty array when no settings exist', () => {
      return request(app.getHttpServer())
        .get('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });

    it('should return settings for authenticated user', async () => {
      await request(app.getHttpServer())
        .post('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetType: 'crypto', thresholdPercent: 5 })
        .expect(201);

      return request(app.getHttpServer())
        .get('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].assetType).toBe('crypto');
        });
    });
  });

  describe('/notifications/settings (POST)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/notifications/settings')
        .send({ assetType: 'crypto' })
        .expect(401);
    });

    it('should create settings for authenticated user', () => {
      return request(app.getHttpServer())
        .post('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetType: 'crypto',
          enabled: true,
          thresholdPercent: 10,
          intervalHours: 4,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.assetType).toBe('crypto');
          expect(res.body.enabled).toBe(true);
          expect(res.body.thresholdPercent).toBe(10);
        });
    });

    it('should create nft settings', () => {
      return request(app.getHttpServer())
        .post('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetType: 'nft',
          enabled: true,
          thresholdPercent: 15,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.assetType).toBe('nft');
        });
    });
  });

  describe('/notifications/settings/:id (PUT)', () => {
    let settingsId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetType: 'crypto', thresholdPercent: 5 });

      settingsId = createResponse.body.id;
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .put(`/notifications/settings/${settingsId}`)
        .send({ thresholdPercent: 10 })
        .expect(401);
    });

    it('should update settings for authenticated user', () => {
      return request(app.getHttpServer())
        .put(`/notifications/settings/${settingsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ thresholdPercent: 20 })
        .expect(200)
        .expect((res) => {
          expect(res.body.thresholdPercent).toBe(20);
        });
    });
  });

  describe('/notifications/settings/:id (DELETE)', () => {
    let settingsId: number;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetType: 'crypto' });

      settingsId = createResponse.body.id;
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/settings/${settingsId}`)
        .expect(401);
    });

    it('should delete settings for authenticated user', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/settings/${settingsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('/notifications/logs (GET)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/notifications/logs')
        .expect(401);
    });

    it('should return empty array when no logs exist', () => {
      return request(app.getHttpServer())
        .get('/notifications/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });
});
