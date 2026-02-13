import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('AssetsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

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
    // Clean up tables before each test
    if (dataSource && dataSource.isInitialized) {
      await dataSource.query('DELETE FROM crypto_asset');
      await dataSource.query('DELETE FROM nft_asset');
      await dataSource.query('DELETE FROM asset');
      await dataSource.query('DELETE FROM user');
    }

    // Register and login to get auth token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;
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
        });

      return request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].symbol).toBe('BTC');
          expect(res.body[0].type).toBe('crypto');
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
        });

      const assetId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(assetId);
          expect(res.body.symbol).toBe('BTC');
          expect(res.body.type).toBe('crypto');
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
        });

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
          expect(res.body.type).toBe('crypto');
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

      const result = await dataSource.query(
        'SELECT * FROM crypto_asset WHERE symbol = ?',
        ['ETH']
      );
      expect(result.length).toBe(1);
      expect(result[0].symbol).toBe('ETH');
      expect(result[0].full_name).toBe('Ethereum');
    });

    it('should return 400 for invalid crypto data', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'crypto',
          // Missing required fields
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
          expect(res.body.type).toBe('nft');
          expect(res.body.collectionName).toBe('Bored Ape Yacht Club');
          expect(res.body.floorPrice).toBe(15);
          expect(res.body.traitPrice).toBe(20);
        });
    });

    it('should save NFT asset to database', async () => {
      await request(app.getHttpServer())
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

      const result = await dataSource.query(
        'SELECT * FROM nft_asset WHERE collection_name = ?',
        ['CryptoPunks']
      );
      expect(result.length).toBe(1);
      expect(result[0].collection_name).toBe('CryptoPunks');
    });

    it('should return 400 for invalid NFT data', () => {
      return request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'nft',
          // Missing required fields
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
        });

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
        });

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
        });

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
        });

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
        });

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
        });

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
        })
        .expect(201);

      // Get all - should have 2 assets
      const getAllResponse = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getAllResponse.body.length).toBe(2);
      
      const types = getAllResponse.body.map((a: any) => a.type);
      expect(types).toContain('crypto');
      expect(types).toContain('nft');
    });
  });
});
