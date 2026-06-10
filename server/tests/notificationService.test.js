jest.mock('../src/config/supabase', () => ({
  from: jest.fn(),
}));

jest.mock('../src/config', () => ({
  frontendUrl: 'http://localhost:3000',
  nodeEnv: 'test',
  notifications: {
    repeatIntervalMs: 5 * 60 * 1000,
    twilioAccountSid: undefined,
    twilioAuthToken: undefined,
    twilioSmsFrom: undefined,
    twilioWhatsappFrom: undefined,
    gmailUser: undefined,
    gmailAppPassword: undefined,
    emailFrom: 'Sentinel <alerts@example.com>',
  },
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

const supabase = require('../src/config/supabase');
const config = require('../src/config');
const {
  startRecurringEmergencyNotifications,
  stopRecurringEmergencyNotifications,
  notifyAlertClosed,
  _private,
} = require('../src/services/notificationService');

const repeatIntervalMs = 5 * 60 * 1000;

const alert = {
  id: 'alert-1',
  user_id: 'user-1',
  tracking_token: 'track-token',
  last_latitude: 6.5244,
  last_longitude: 3.3792,
  user_name: 'Test User',
};

const contacts = [
  {
    id: 'contact-phone-email',
    phone: '+2348011111111',
    email: 'both@example.com',
    notification_enabled: true,
  },
  {
    id: 'contact-phone',
    phone: '+2348022222222',
    email: null,
    notification_enabled: true,
  },
  {
    id: 'contact-email',
    phone: '',
    email: 'email@example.com',
    notification_enabled: true,
  },
  {
    id: 'contact-disabled',
    phone: '+2348033333333',
    email: 'disabled@example.com',
    notification_enabled: false,
  },
];

const setupSupabase = ({ activeAlert = alert, recurringContacts = contacts } = {}) => {
  const insert = jest.fn().mockResolvedValue({ error: null });

  const alertQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: activeAlert, error: null }),
  };

  const contactsQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: recurringContacts, error: null }),
  };

  supabase.from.mockImplementation((table) => {
    if (table === 'alert_notifications') return { insert };
    if (table === 'sos_alerts') return alertQuery;
    if (table === 'emergency_contacts') return contactsQuery;
    throw new Error(`Unexpected table: ${table}`);
  });

  return { insert, alertQuery, contactsQuery };
};

describe('notificationService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_SMS_FROM;
    delete process.env.TWILIO_WHATSAPP_FROM;
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete global.fetch;
    config.notifications.twilioAccountSid = undefined;
    config.notifications.twilioAuthToken = undefined;
    config.notifications.twilioSmsFrom = undefined;
    config.notifications.twilioWhatsappFrom = undefined;
  });

  afterEach(() => {
    stopRecurringEmergencyNotifications(alert.id);
    jest.useRealTimers();
  });

  it('notifies all enabled contacts through every available channel immediately', async () => {
    const { insert } = setupSupabase();

    await startRecurringEmergencyNotifications(alert, contacts);

    expect(insert).toHaveBeenCalledTimes(4);
    expect(insert.mock.calls.map(([payload]) => payload.channel)).toEqual(
      expect.arrayContaining(['sms', 'email', 'sms', 'email'])
    );
    expect(insert.mock.calls.map(([payload]) => payload.contact_id)).not.toContain('contact-disabled');
  });

  it('normalizes Nigerian phone numbers before SMS provider delivery', () => {
    expect(_private.normalizePhoneNumber('+234 801 111 1111')).toBe('2348011111111');
    expect(_private.normalizePhoneNumber('08011111111')).toBe('2348011111111');
    expect(_private.normalizePhoneNumber('8011111111')).toBe('2348011111111');
    expect(_private.normalizePhoneNumber('002348011111111')).toBe('2348011111111');
  });

  it('sends Twilio WhatsApp first for phone notifications', async () => {
    config.notifications.twilioAccountSid = 'AC123';
    config.notifications.twilioAuthToken = 'auth-token';
    config.notifications.twilioSmsFrom = '+15551230000';
    config.notifications.twilioWhatsappFrom = 'whatsapp:+14155238886';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify({ sid: 'SMwhatsapp' })),
    });

    const result = await _private.sendPhoneNotification({ id: 'contact-sms', phone: '08011111111' }, 'Help is needed');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
    );

    const requestBody = global.fetch.mock.calls[0][1].body;
    expect(requestBody).toContain('To=whatsapp%3A%2B2348011111111');
    expect(requestBody).toContain('From=whatsapp%3A%2B14155238886');
    expect(requestBody).toContain('Body=Help+is+needed');
    expect(result.channel).toBe('whatsapp');
  });

  it('falls back to Twilio SMS when WhatsApp sending fails', async () => {
    config.notifications.twilioAccountSid = 'AC123';
    config.notifications.twilioAuthToken = 'auth-token';
    config.notifications.twilioSmsFrom = '+15551230000';
    config.notifications.twilioWhatsappFrom = 'whatsapp:+14155238886';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Not a WhatsApp recipient'),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: jest.fn().mockResolvedValue(JSON.stringify({ sid: 'SMsms' })),
      });

    const result = await _private.sendPhoneNotification({ id: 'contact-sms', phone: '08011111111' }, 'Help is needed');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][1].body).toContain('To=whatsapp%3A%2B2348011111111');
    expect(global.fetch.mock.calls[1][1].body).toContain('To=%2B2348011111111');
    expect(global.fetch.mock.calls[1][1].body).toContain('From=%2B15551230000');
    expect(result.channel).toBe('sms');
  });

  it('targets every enabled contact that has a phone or email', () => {
    expect(_private.enabledContacts(contacts).map((contact) => contact.id)).toEqual([
      'contact-phone-email',
      'contact-phone',
      'contact-email',
    ]);
  });

  it('repeats emergency notifications every 5 minutes while the alert remains active', async () => {
    const { insert, alertQuery, contactsQuery } = setupSupabase();

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));
    expect(insert).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(repeatIntervalMs);

    expect(alertQuery.maybeSingle).toHaveBeenCalledTimes(1);
    expect(contactsQuery.order).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(6);
  });

  it('stops reminders and sends final safe or cancelled notifications', async () => {
    const { insert, alertQuery } = setupSupabase();

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));
    await notifyAlertClosed(alert, contacts.slice(0, 1), 'resolved');

    await jest.advanceTimersByTimeAsync(repeatIntervalMs);

    expect(alertQuery.maybeSingle).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(4);
    expect(insert.mock.calls.map(([payload]) => payload.channel)).toEqual(
      expect.arrayContaining(['sms', 'email'])
    );
  });

  it('sends a safe update message when the alert is resolved', async () => {
    setupSupabase();
    config.notifications.twilioAccountSid = 'AC123';
    config.notifications.twilioAuthToken = 'auth-token';
    config.notifications.twilioSmsFrom = '+15551230000';
    config.notifications.twilioWhatsappFrom = undefined;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: jest.fn().mockResolvedValue(JSON.stringify({ sid: 'SMsafe' })),
    });

    await notifyAlertClosed(alert, contacts.slice(1, 2), 'resolved');

    const requestBody = global.fetch.mock.calls[0][1].body;
    expect(requestBody).toContain('Sentinel+update%3A+Test+User+has+marked+themselves+safe');
    expect(requestBody).toContain('Alert+status%3A+Safe');
  });

  it('sends a cancelled update message when the alert is cancelled', async () => {
    setupSupabase();
    config.notifications.twilioAccountSid = 'AC123';
    config.notifications.twilioAuthToken = 'auth-token';
    config.notifications.twilioSmsFrom = '+15551230000';
    config.notifications.twilioWhatsappFrom = undefined;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: jest.fn().mockResolvedValue(JSON.stringify({ sid: 'SMcancelled' })),
    });

    await notifyAlertClosed(alert, contacts.slice(1, 2), 'cancelled');

    const requestBody = global.fetch.mock.calls[0][1].body;
    expect(requestBody).toContain('Sentinel+update%3A+Test+User+has+cancelled+the+emergency+alert');
    expect(requestBody).toContain('Alert+status%3A+Cancelled');
  });
});
