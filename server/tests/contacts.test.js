const request = require('supertest');
const app = require('../src/index');

jest.mock('../src/config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: { getUser: jest.fn() },
}));

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

jest.mock('../src/middleware/rateLimiter', () => ({
  sosLimiter: (req, res, next) => next(),
  generalLimiter: (req, res, next) => next(),
}));

const supabase = require('../src/config/supabase');

const mockContact = {
  id: 'contact-1',
  user_id: 'test-user-id',
  full_name: 'Jane Doe',
  phone: '+2348012345678',
  relationship: 'Spouse',
  notification_enabled: true,
};

describe('Contacts API', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/contacts', () => {
    it('should return list of contacts', async () => {
      supabase.order = jest.fn().mockResolvedValueOnce({ data: [mockContact], error: null });

      const res = await request(app)
        .get('/api/contacts')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/contacts', () => {
    it('should create a contact', async () => {
      supabase.single.mockResolvedValueOnce({ data: mockContact, error: null });

      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({
          full_name: 'Jane Doe',
          phone: '+2348012345678',
          email: 'jane@example.com',
          relationship: 'Spouse',
        });

      expect(res.status).toBe(201);
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({ phone: '+2348012345678' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({
          full_name: 'Jane Doe',
          phone: '+2348012345678',
          relationship: 'Spouse',
          email: 'not-an-email',
        });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete a contact', async () => {
      supabase.eq = jest.fn().mockResolvedValueOnce({ error: null });

      const res = await request(app)
        .delete('/api/contacts/contact-1')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
    });
  });
});
