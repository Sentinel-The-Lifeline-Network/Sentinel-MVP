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
  maybeSingle: jest.fn(),
  data: null,
  error: null,
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

jest.mock('../src/services/whatsappService', () => {
  const actual = jest.requireActual('../src/services/whatsappService');
  return {
    ...actual,
    sendWhatsAppMessage: jest.fn().mockResolvedValue({ status: 'sent' }),
  };
});

const supabase = require('../src/config/supabase');
const whatsappService = require('../src/services/whatsappService');

const mockContact = {
  id: 'contact-1',
  user_id: 'test-user-id',
  contact_name: 'Jane Doe',
  phone_number: '+2348012345678',
  relationship: 'Spouse',
  priority: 2,
  invite_status: 'pending_invite',
  invite_token: 'sometoken',
  invite_link: 'http://localhost:3000/invite/sometoken',
};

describe('Contacts API', () => {
  beforeEach(() => {
    supabase.data = null;
    supabase.error = null;
    supabase.single.mockResolvedValue({ data: mockContact, error: null });
    supabase.maybeSingle.mockResolvedValue({ data: mockContact, error: null });
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /api/contacts', () => {
    it('should return list of contacts', async () => {
      supabase.data = [mockContact];

      const res = await request(app)
        .get('/api/contacts')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([mockContact]);
    });
  });

  describe('POST /api/contacts', () => {
    it('should create a contact', async () => {
      supabase.data = [];

      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({
          contact_name: 'Jane Doe',
          phone_number: '+2348012345678',
          relationship: 'Spouse',
          priority: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(mockContact);
    });

    it('should return 422 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({ phone_number: '+2348012345678' });

      expect(res.status).toBe(422);
    });

    it('should return 422 for invalid phone number format', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({
          contact_name: 'Jane Doe',
          phone_number: '08012345678',
          relationship: 'Spouse',
        });

      expect(res.status).toBe(422);
    });

    it('should return 409 when the maximum number of contacts is reached', async () => {
      supabase.data = Array.from({ length: 10 }, (_, i) => ({
        ...mockContact,
        id: `contact-${i}`,
        phone_number: `+234801234${String(i).padStart(4, '0')}`,
      }));

      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({
          contact_name: 'New Contact',
          phone_number: '+2348099999999',
          relationship: 'Friend',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/Maximum of 10/);
    });

    it('should return 409 for a duplicate phone number', async () => {
      supabase.data = [mockContact];

      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', 'Bearer fake-token')
        .send({
          contact_name: 'Duplicate',
          phone_number: '+2348012345678',
          relationship: 'Friend',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/);
    });
  });

  describe('DELETE /api/contacts/:id', () => {
    it('should delete a contact', async () => {
      supabase.error = null;

      const res = await request(app)
        .delete('/api/contacts/contact-1')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/contacts/:id/resend-invite', () => {
    it('should resend the whatsapp invite', async () => {
      const res = await request(app)
        .post('/api/contacts/contact-1/resend-invite')
        .set('Authorization', 'Bearer fake-token');

      expect(res.status).toBe(200);
      expect(whatsappService.sendWhatsAppMessage).toHaveBeenCalledWith(
        mockContact.phone_number,
        expect.stringContaining(mockContact.invite_link)
      );
    });
  });
});
