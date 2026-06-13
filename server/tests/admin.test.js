jest.mock('../src/config', () => ({
  port: 4000,
  nodeEnv: 'test',
  frontendUrl: 'http://localhost:3000',
  allowedOrigins: ['http://localhost:3000'],
  rateLimit: { windowMs: 60000, max: 5 },
  contacts: { maxCount: 10 },
  notifications: {
    repeatIntervalMs: 5 * 60 * 1000,
    twilioAccountSid: undefined,
    twilioAuthToken: undefined,
    twilioWhatsappFrom: undefined,
  },
  firebase: { projectId: undefined, clientEmail: undefined, privateKey: undefined },
  adminApiKey: 'test-admin-key',
}));

jest.mock('../src/config/supabase', () => ({
  from: jest.fn(),
}));

jest.mock('../src/middleware/rateLimiter', () => ({
  sosLimiter: (req, res, next) => next(),
  generalLimiter: (req, res, next) => next(),
}));

const request = require('supertest');
const app = require('../src/index');
const supabase = require('../src/config/supabase');

const setupSupabase = ({ users = [], alerts = [], contacts = [], notifications = [], views = [] } = {}) => {
  supabase.from.mockImplementation((table) => {
    if (table === 'users') {
      return {
        select: jest.fn((columns, opts) => {
          if (opts?.count === 'exact') return Promise.resolve({ count: users.length, error: null });
          return Promise.resolve({ data: users, error: null });
        }),
      };
    }
    if (table === 'sos_alerts') {
      return {
        select: jest.fn((columns, opts) => {
          if (opts?.count === 'exact') return Promise.resolve({ count: alerts.length, error: null });
          return { order: jest.fn().mockResolvedValue({ data: alerts, error: null }) };
        }),
      };
    }
    if (table === 'emergency_contacts') {
      return {
        select: jest.fn((columns, opts) => {
          if (opts?.count === 'exact') return Promise.resolve({ count: contacts.length, error: null });
          return Promise.resolve({ data: contacts, error: null });
        }),
      };
    }
    if (table === 'notifications_log') {
      return {
        select: jest.fn().mockResolvedValue({ data: notifications, error: null }),
      };
    }
    if (table === 'tracking_link_views') {
      return {
        select: jest.fn((columns, opts) => {
          if (opts?.count === 'exact') return Promise.resolve({ count: views.length, error: null });
          return { in: jest.fn().mockResolvedValue({ data: views, error: null }) };
        }),
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });
};

describe('Admin API', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/admin/stats', () => {
    it('rejects requests without a valid admin key', async () => {
      setupSupabase();

      const res = await request(app).get('/api/admin/stats');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects requests with the wrong admin key', async () => {
      setupSupabase();

      const res = await request(app).get('/api/admin/stats').set('x-admin-key', 'wrong-key');

      expect(res.status).toBe(401);
    });

    it('returns aggregated stats for a valid admin key', async () => {
      const now = new Date().toISOString();
      setupSupabase({
        users: [{ created_at: now }],
        alerts: [
          {
            id: 'alert-1',
            status: 'active',
            started_at: now,
            ended_at: null,
            created_at: now,
            tracking_token: 'track-1',
            users: { full_name: 'Jane Doe' },
          },
          {
            id: 'alert-2',
            status: 'resolved',
            started_at: now,
            ended_at: now,
            created_at: now,
            tracking_token: 'track-2',
            users: { full_name: 'John Doe' },
          },
        ],
        contacts: [{ invite_status: 'push_enabled' }, { invite_status: 'pending_invite' }],
        notifications: [
          { channel: 'whatsapp', status: 'sent' },
          { channel: 'push', status: 'failed' },
        ],
        views: [{ alert_id: 'alert-1' }, { alert_id: 'alert-1' }],
      });

      const res = await request(app).get('/api/admin/stats').set('x-admin-key', 'test-admin-key');

      expect(res.status).toBe(200);
      expect(res.body.data.totals).toEqual({
        users: 1,
        alerts: 2,
        contacts: 2,
        trackingViews: 2,
        activeAlerts: 1,
        resolvedAlerts: 1,
        cancelledAlerts: 0,
        pushEnabledContacts: 1,
      });
      expect(res.body.data.notificationStats).toEqual({
        whatsapp: { sent: 1 },
        push: { failed: 1 },
      });
      expect(res.body.data.recentAlerts).toHaveLength(2);
      expect(res.body.data.recentAlerts[0]).toMatchObject({
        id: 'alert-1',
        user_name: 'Jane Doe',
        tracking_views: 2,
      });
      expect(res.body.data.signupsByDay).toHaveLength(14);
      expect(res.body.data.alertsByDay).toHaveLength(14);
    });
  });
});
