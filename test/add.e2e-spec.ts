import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GET /add (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // AC1: GET /add?num1=2&num2=3 returns HTTP 200 with body {"result": 5}
  it('AC1: returns sum of two positive numbers', () => {
    return request(app.getHttpServer())
      .get('/add?num1=2&num2=3')
      .expect(200)
      .expect({ result: 5 });
  });

  // AC2: GET /add?num1=-1&num2=1 returns HTTP 200 with body {"result": 0}
  it('AC2: returns sum when result is zero (negative + positive)', () => {
    return request(app.getHttpServer())
      .get('/add?num1=-1&num2=1')
      .expect(200)
      .expect({ result: 0 });
  });

  // AC3: GET /add?num1=abc&num2=2 returns HTTP 400
  it('AC3: returns 400 when num1 is non-numeric', () => {
    return request(app.getHttpServer())
      .get('/add?num1=abc&num2=2')
      .expect(400);
  });

  // AC4: missing param returns HTTP 400
  it('AC4: returns 400 when num1 is missing', () => {
    return request(app.getHttpServer())
      .get('/add?num2=3')
      .expect(400);
  });

  it('AC4: returns 400 when num2 is missing', () => {
    return request(app.getHttpServer())
      .get('/add?num1=2')
      .expect(400);
  });
});

describe('GET /sub (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // AC1: GET /sub?num1=5&num2=3 returns HTTP 200 with body {"result": 2}
  it('AC1: returns difference of two numbers (positive result)', () => {
    return request(app.getHttpServer())
      .get('/sub?num1=5&num2=3')
      .expect(200)
      .expect({ result: 2 });
  });

  // AC2: GET /sub?num1=1&num2=5 returns HTTP 200 with body {"result": -4}
  it('AC2: returns difference when result is negative', () => {
    return request(app.getHttpServer())
      .get('/sub?num1=1&num2=5')
      .expect(200)
      .expect({ result: -4 });
  });

  // AC3: GET /sub?num1=abc&num2=2 returns HTTP 400
  it('AC3: returns 400 when num1 is non-numeric', () => {
    return request(app.getHttpServer())
      .get('/sub?num1=abc&num2=2')
      .expect(400);
  });

  // AC4: missing param returns HTTP 400
  it('AC4: returns 400 when num1 is missing', () => {
    return request(app.getHttpServer())
      .get('/sub?num2=3')
      .expect(400);
  });

  it('AC4: returns 400 when num2 is missing', () => {
    return request(app.getHttpServer())
      .get('/sub?num1=5')
      .expect(400);
  });
});
