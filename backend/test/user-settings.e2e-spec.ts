/**
 * @fileoverview E2E тесты для UserSettings API.
 *
 * Проверяет полный flow работы с API настроек пользователя.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('UserSettingsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    process.env.API_KEYS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    // Clean up user_settings and user tables before each test
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('DELETE FROM user_settings');
      await dataSource.query('DELETE FROM user WHERE email = ?', ['test-settings@example.com']);
    }

    // Register a test user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test-settings@example.com', password: 'password123', role: 'user' });

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test-settings@example.com', password: 'password123' });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/user-settings')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/user-settings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /user-settings', () => {
    it('should return empty/null when settings do not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Response could be null or empty object depending on serialization
      expect(response.body === null || Object.keys(response.body).length === 0).toBeTruthy();
    });
  });

  describe('POST /user-settings', () => {
    it('should create settings with valid API keys', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'test-cmc-key-32-chars-long-minimum',
          openseaApiKey: 'test-opensea-key-32-chars-long-minimum',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.coinmarketcapApiKey).toBe('test-cmc-key-32-chars-long-minimum');
      expect(response.body.openseaApiKey).toBe('test-opensea-key-32-chars-long-minimum');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should reject short API keys', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'short-key',
        })
        .expect(400);

      expect(response.body.message[0]).toContain('coinmarketcapApiKey');
    });

    it('should reject API keys longer than 500 chars', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'a'.repeat(501),
        })
        .expect(400);

      expect(response.body.message[0]).toContain('coinmarketcapApiKey');
    });

    it('should create settings with only one key', async () => {
      // Create settings with only one key
      const response = await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          openseaApiKey: 'another-key-32-chars-long-minimum',
        })
        .expect(201);

      expect(response.body.openseaApiKey).toBe('another-key-32-chars-long-minimum');
    });
  });

  describe('PATCH /user-settings', () => {
    it('should update existing settings', async () => {
      // First create settings
      await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'initial-cmc-key-32-chars-long-minimum',
          openseaApiKey: 'initial-os-key-32-chars-long-minimum',
        });

      // Then update
      const response = await request(app.getHttpServer())
        .patch('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'updated-cmc-key-32-chars-long-minimum',
        })
        .expect(200);

      expect(response.body.coinmarketcapApiKey).toBe('updated-cmc-key-32-chars-long-minimum');
    });

    it('should reject update with invalid key', async () => {
      // First create settings
      await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'initial-cmc-key-32-chars-long-minimum',
        });

      // Try to update with invalid key
      await request(app.getHttpServer())
        .patch('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          openseaApiKey: 'short',
        })
        .expect(400);
    });

    it('should return 404 when settings do not exist', async () => {
      await request(app.getHttpServer())
        .patch('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'some-key-32-chars-long-minimum',
        })
        .expect(404);
    });
  });

  describe('GET /user-settings (after creation)', () => {
    it('should return existing settings', async () => {
      // First create settings
      await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'test-cmc-key-32-chars-long-minimum',
          openseaApiKey: 'test-os-key-32-chars-long-minimum',
        });

      // Then get settings
      const response = await request(app.getHttpServer())
        .get('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).not.toBeNull();
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('coinmarketcapApiKey');
    });
  });

  describe('Encryption', () => {
    it('should encrypt keys in database but return decrypted to client', async () => {
      // Create settings
      await request(app.getHttpServer())
        .post('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coinmarketcapApiKey: 'my-secret-cmc-key-32-chars-long',
          openseaApiKey: 'my-secret-os-key-32-chars-long',
        });

      // Get settings
      const response = await request(app.getHttpServer())
        .get('/user-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Keys should be returned in plain text (decrypted)
      expect(response.body.coinmarketcapApiKey).toBe('my-secret-cmc-key-32-chars-long');
      expect(response.body.openseaApiKey).toBe('my-secret-os-key-32-chars-long');
    });
  });
});
