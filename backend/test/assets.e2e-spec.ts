import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('AssetsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testCounter = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable validation pipe for E2E tests
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    
    // Ensure database is synchronized
    if (dataSource && dataSource.isInitialized) {
      try {
        await dataSource.synchronize(true);
        console.log('Database synchronized successfully');
      } catch (error) {
        console.log('Database synchronization error:', error.message);
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    testCounter++;
    const uniqueEmail = `test${testCounter}_${Date.now()}@example.com`;

    // Clean up tables before each test
    if (dataSource && dataSource.isInitialized) {
      try {
        // For Table Per Class inheritance, child tables are managed by TypeORM
        // We only need to clean the base 'asset' table
        await dataSource.query('DELETE FROM notification_log');
        await dataSource.query('DELETE FROM historical_price');
        await dataSource.query('DELETE FROM asset');
        await dataSource.query('DELETE FROM notification_settings');
        await dataSource.query('DELETE FROM user');
      } catch (error) {
        // Ignore cleanup errors on first run
      }
    }

    // Register and login to get auth token with unique email
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: uniqueEmail,
        password: 'password123',
        role: 'user',
      });

    // Check register response - supertest uses status property
    const registerStatus = (registerResponse as any).status;
    if (registerStatus !== 201) {
      console.log('Register response status:', registerStatus);
      console.log('Register response body:', registerResponse.body);
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password123',
      });

    // Check login response - supertest uses status property
    const loginStatus = (loginResponse as any).status;
    if (loginStatus !== 200) {
      console.log('Login response status:', loginStatus);
      console.log('Login response body:', loginResponse.body);
      throw new Error('Failed to authenticate');
    }

    authToken = loginResponse.body.access_token;
    if (!authToken) {
      console.log('Login response body:', loginResponse.body);
      throw new Error('No access_token in login response');
    }
  });

  describe('GET /assets', () => {
    it('should return empty array when no assets exist', () => {
      return request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return all assets', async () => {
      // Create a crypto asset first
      await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 50000,
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].symbol).toBe('BTC');
          // Note: TypeORM Table Per Class inheritance doesn't return 'type' field
          // We verify it's a crypto asset by checking the symbol field
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/assets')
        .expect(401);
    });
  });

  describe('GET /assets/:id', () => {
    it('should return asset by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 50000,
        })
        .expect(201);

      const assetId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(assetId);
          expect(res.body.symbol).toBe('BTC');
        });
    });

    it('should return 404 for non-existent asset', () => {
      return request(app.getHttpServer())
        .get('/assets/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 50000,
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/assets/${createResponse.body.id}`)
        .expect(401);
    });
  });

  describe('POST /assets - Crypto', () => {
    it('should create crypto asset', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 50000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.symbol).toBe('BTC');
          expect(res.body.fullName).toBe('Bitcoin');
          expect(res.body.amount).toBe(1.5);
          expect(res.body.middlePrice).toBe(45000);
          expect(res.body.currentPrice).toBe(50000);
        });
    });

    it('should save crypto asset to database', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 2.0,
          middlePrice: 3000,
          symbol: 'ETH',
          fullName: 'Ethereum',
          currentPrice: 3500,
        })
        .expect(201);

      // Verify by retrieving the asset through API
      const assetId = response.body.id;
      const getResponse = await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.symbol).toBe('ETH');
      expect(getResponse.body.fullName).toBe('Ethereum');
      expect(getResponse.body.amount).toBe(2.0);
    });

    it('should return 400 for invalid crypto data', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          // Missing required fields: amount, middlePrice, symbol
        })
        .expect(400);
    });

    it('should return 400 for invalid type enum', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'invalid_type',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
        })
        .expect(400);
    });
  });

  describe('POST /assets - NFT', () => {
    it('should create NFT asset', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'nft',
          amount: 1,
          middlePrice: 10,
          collectionName: 'Bored Ape Yacht Club',
          floorPrice: 15,
          traitPrice: 20,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.collectionName).toBe('Bored Ape Yacht Club');
          expect(res.body.floorPrice).toBe(15);
          expect(res.body.traitPrice).toBe(20);
        });
    });

    it('should save NFT asset to database', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'nft',
          amount: 1,
          middlePrice: 5,
          collectionName: 'CryptoPunks',
          floorPrice: 50,
        })
        .expect(201);

      // Verify by retrieving the asset through API
      const assetId = createResponse.body.id;
      const getResponse = await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.collectionName).toBe('CryptoPunks');
      expect(getResponse.body.floorPrice).toBe(50);
    });

    it('should return 400 for invalid NFT data', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'nft',
          // Missing required fields: amount, middlePrice, collectionName
        })
        .expect(400);
    });
  });

  describe('PUT /assets/:id', () => {
    it('should update existing asset', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 50000,
        })
        .expect(201);

      const assetId = createResponse.body.id;

      return request(app.getHttpServer())
        .put(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 2.0,
          middlePrice: 46000,
          currentPrice: 55000,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(assetId);
          expect(res.body.amount).toBe(2.0);
          expect(res.body.middlePrice).toBe(46000);
          expect(res.body.currentPrice).toBe(55000);
          expect(res.body.symbol).toBe('BTC'); // Unchanged
        });
    });

    it('should update asset in database', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1,
          middlePrice: 100,
          symbol: 'TEST',
          fullName: 'Test Coin',
          currentPrice: 200,
        })
        .expect(201);

      const assetId = createResponse.body.id;

      await request(app.getHttpServer())
        .put(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5,
        })
        .expect(200);

      const result = await dataSource.query(
        'SELECT amount FROM asset WHERE id = ?',
        [assetId]
      );
      expect(result[0].amount).toBe(5);
    });

    it('should return 404 for non-existent asset', () => {
      return request(app.getHttpServer())
        .put('/assets/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1.0,
        })
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1,
          middlePrice: 100,
          symbol: 'TEST',
          fullName: 'Test Coin',
          currentPrice: 200,
        })
        .expect(201);

      return request(app.getHttpServer())
        .put(`/assets/${createResponse.body.id}`)
        .send({
          amount: 2.0,
        })
        .expect(401);
    });
  });

  describe('DELETE /assets/:id', () => {
    it('should delete existing asset', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 50000,
        })
        .expect(201);

      const assetId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify asset is deleted
      return request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should remove asset from database', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1,
          middlePrice: 100,
          symbol: 'DELETE_TEST',
          fullName: 'Delete Test',
          currentPrice: 200,
        })
        .expect(201);

      const assetId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const result = await dataSource.query(
        'SELECT * FROM asset WHERE id = ?',
        [assetId]
      );
      expect(result.length).toBe(0);
    });

    it('should return 404 for non-existent asset', () => {
      return request(app.getHttpServer())
        .delete('/assets/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1,
          middlePrice: 100,
          symbol: 'TEST',
          fullName: 'Test Coin',
          currentPrice: 200,
        })
        .expect(201);

      return request(app.getHttpServer())
        .delete(`/assets/${createResponse.body.id}`)
        .expect(401);
    });
  });

  describe('Full CRUD cycle', () => {
    it('should complete full CRUD cycle for crypto asset', async () => {
      // Create
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1.5,
          middlePrice: 45000,
          symbol: 'CRUD_TEST',
          fullName: 'CRUD Test Coin',
          currentPrice: 50000,
        })
        .expect(201);

      const assetId = createResponse.body.id;
      expect(assetId).toBeDefined();

      // Read (Get by ID)
      await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.symbol).toBe('CRUD_TEST');
          expect(res.body.amount).toBe(1.5);
        });

      // Update
      await request(app.getHttpServer())
        .put(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 3.0,
          currentPrice: 55000,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.amount).toBe(3.0);
          expect(res.body.currentPrice).toBe(55000);
        });

      // Read (Get all)
      await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(1);
          expect(res.body[0].amount).toBe(3.0);
        });

      // Delete
      await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should complete full CRUD cycle for NFT asset', async () => {
      // Create
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'nft',
          amount: 1,
          middlePrice: 10,
          collectionName: 'CRUD Collection',
          floorPrice: 15,
          traitPrice: 20,
        })
        .expect(201);

      const assetId = createResponse.body.id;

      // Read
      await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.collectionName).toBe('CRUD Collection');
        });

      // Update
      await request(app.getHttpServer())
        .put(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          floorPrice: 20,
        })
        .expect(200);

      // Delete
      await request(app.getHttpServer())
        .delete(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify
      await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle multiple assets', async () => {
      // Create crypto asset
      await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          amount: 1,
          middlePrice: 50000,
          symbol: 'BTC',
          fullName: 'Bitcoin',
          currentPrice: 55000,
        })
        .expect(201);

      // Create NFT asset
      await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'nft',
          amount: 1,
          middlePrice: 10,
          collectionName: 'BAYC',
          floorPrice: 15,
        })
        .expect(201);

      // Get all - should have 2 assets
      const getAllResponse = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getAllResponse.body.length).toBe(2);
      
      // Check that we have both crypto and NFT assets by their specific fields
      const hasCrypto = getAllResponse.body.some((a: any) => a.symbol === 'BTC');
      const hasNFT = getAllResponse.body.some((a: any) => a.collectionName === 'BAYC');
      expect(hasCrypto).toBe(true);
      expect(hasNFT).toBe(true);
    });
  });
});
