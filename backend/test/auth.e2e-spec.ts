import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('DELETE FROM user');
    }
  });

  describe('/auth/register (POST)', () => {
    it('should successfully register a new user (201)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.role).toBe('user');
          expect(res.body.id).toBeDefined();
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should save user to database', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'dbtest@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201);

      const result = await dataSource.query(
        'SELECT * FROM user WHERE email = ?',
        ['dbtest@example.com']
      );
      expect(result.length).toBe(1);
      expect(result[0].email).toBe('dbtest@example.com');
    });

    it('should return 400 for duplicate email', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201);

      // Try to register again with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(400);
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          role: 'user',
        })
        .expect(400);
    });

    it('should return 400 for short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          role: 'user',
        })
        .expect(400);
    });

    it('should hash password before saving', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'hashtest@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201);

      const result = await dataSource.query(
        'SELECT password FROM user WHERE email = ?',
        ['hashtest@example.com']
      );
      expect(result[0].password).not.toBe('password123');
      expect(result[0].password.length).toBeGreaterThan(20);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user before login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          role: 'user',
        });
    });

    it('should return 200 and JWT token on successful login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(typeof res.body.access_token).toBe('string');
          expect(res.body.access_token.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return valid JWT token that can be used for protected routes', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.access_token;
      expect(token).toBeDefined();

      // Token should be in JWT format (3 parts separated by dots)
      const tokenParts = token.split('.');
      expect(tokenParts.length).toBe(3);
    });

    it('should return 400 for missing email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
        })
        .expect(400);
    });
  });

  describe('Protected routes', () => {
    it('should access protected route with valid token', async () => {
      // Register and login to get token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'protected@example.com',
          password: 'password123',
          role: 'user',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'protected@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.access_token;

      // Try to access protected assets endpoint
      return request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer())
        .get('/assets')
        .expect(401);
    });

    it('should reject access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });
});
