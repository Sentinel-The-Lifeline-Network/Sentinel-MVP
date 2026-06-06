const request = require('supertest');
const app = require('../src/index');

jest.mock('../src/config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
  auth: { getUser: jest.fn() },
}));

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  },
}));

jest.mock('../src/middleware/rateLimiter', () => ({
  sosLimiter: (req, res, next) => next(),
  generalLimiter: (req, res, next) => next(),
}));

const supabase = require('../src/config/supabase');

describe('Tracking API', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/tracking/:token', () => {
    it('should return tracking data for valid token', async () => {
      supabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'alert-1',
            status: 'active',
            tracking_token: 'valid-token',
            last_latitude: 6.5244,
            last_longitude: 3.3792,
            started_at: new Date().toISOString(),
            users: { full_name: 'John Doe' },
          },
          error: null,
        });

      supabase.order = jest.fn().mockResolvedValueOnce({ data: [], error: null });

      const res = await request(app).get('/api/tracking/valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user_name).toBe('John Doe');
    });

    it('should return 404 for invalid tracking token', async () => {
      supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const res = await request(app).get('/api/tracking/invalid-token');

      expect(res.status).toBe(404);
    });
  });
});
