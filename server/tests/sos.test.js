const request = require('supertest');
const app = require('../src/index');

jest.mock('../src/config/supabase', () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  auth: { getUser: jest.fn() },
}));

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
  authenticateResponder: (req, res, next) => {
    req.user = { id: 'responder-id', email: 'responder@example.com' };
    next();
  },
}));

jest.mock('../src/middleware/rateLimiter', () => ({
  sosLimiter: (req, res, next) => next(),
  generalLimiter: (req, res, next) => next(),
}));

jest.mock('../src/services/notificationService', () => ({
  startRecurringEmergencyNotifications: jest.fn(),
  notifyAlertClosed: jest.fn(),
}));

const supabase = require('../src/config/supabase');
const {
  startRecurringEmergencyNotifications,
} = require('../src/services/notificationService');

describe('SOS API', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/sos/trigger', () => {
    it('should return 201 when SOS is triggered successfully', async () => {
      supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      supabase.single
        .mockResolvedValueOnce({
          data: {
            id: 'alert-1',
            user_id: 'test-user-id',
            status: 'active',
            tracking_token: 'abc123',
            started_at: new Date().toISOString(),
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { full_name: 'Test User' }, error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      supabase.from.mockReturnThis();

      const res = await request(app)
        .post('/api/sos/trigger')
        .set('Authorization', 'Bearer fake-token')
        .send({ latitude: 6.5244, longitude: 3.3792 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(startRecurringEmergencyNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'alert-1', user_name: 'Test User' }),
        []
      );
    });

    it('should return 409 when active alert already exists', async () => {
      supabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'existing-alert', user_id: 'test-user-id', status: 'active' },
        error: null,
      });
      supabase.single
        .mockResolvedValueOnce({ data: { full_name: 'Test User' }, error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const res = await request(app)
        .post('/api/sos/trigger')
        .set('Authorization', 'Bearer fake-token')
        .send({ latitude: 6.5244, longitude: 3.3792 });

      expect(res.status).toBe(409);
      expect(startRecurringEmergencyNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'existing-alert', user_name: expect.any(String) }),
        []
      );
    });

    it('should return 422 for invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/sos/trigger')
        .set('Authorization', 'Bearer fake-token')
        .send({ latitude: 999, longitude: 3.3792 });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/sos/active', () => {
    it('should return active alert', async () => {
      supabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'alert-1', status: 'active' },
        error: null,
      });

      const res = await request(app)
        .get('/api/sos/active')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/sos/:alertId/location', () => {
    it('should update location successfully', async () => {
      supabase.single.mockResolvedValue({ data: {}, error: null });

      const res = await request(app)
        .put('/api/sos/alert-1/location')
        .set('Authorization', 'Bearer fake-token')
        .send({ latitude: 6.5244, longitude: 3.3792, accuracy: 10 });

      expect(res.status).toBe(200);
    });

    it('should return 422 for missing coordinates', async () => {
      const res = await request(app)
        .put('/api/sos/alert-1/location')
        .set('Authorization', 'Bearer fake-token')
        .send({ accuracy: 10 });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/sos/history', () => {
    it('should return alert history', async () => {
      const mockAlerts = [
        { id: '1', status: 'resolved', started_at: new Date().toISOString() },
        { id: '2', status: 'cancelled', started_at: new Date().toISOString() },
      ];
      supabase.from.mockReturnThis();

      const res = await request(app)
        .get('/api/sos/history')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
    });
  });
});
