jest.mock('../src/config/supabase', () => ({
  from: jest.fn(),
}));

jest.mock('../src/config', () => ({
  frontendUrl: 'http://localhost:3000',
  nodeEnv: 'test',
  notifications: {
    repeatIntervalMs: 5 * 60 * 1000,
    africasTalkingApiKey: undefined,
    africasTalkingUsername: 'sandbox',
    africasTalkingSenderId: undefined,
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
    delete process.env.AFRICAS_TALKING_API_KEY;
    delete process.env.AFRICAS_TALKING_USERNAME;
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    delete global.fetch;
    config.notifications.africasTalkingApiKey = undefined;
    config.notifications.africasTalkingUsername = 'sandbox';
    config.notifications.africasTalkingSenderId = undefined;
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

  it('sends Africa\'s Talking SMS with bearer authorization and form body', async () => {
    config.notifications.africasTalkingApiKey = 'test-api-key';
    config.notifications.africasTalkingUsername = 'sandbox';
    config.notifications.africasTalkingSenderId = 'Sentinel';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify({
        SMSMessageData: {
          Recipients: [{ status: 'Success', number: '+2348011111111' }],
        },
      })),
    });

    await _private.sendSms({ id: 'contact-sms', phone: '08011111111' }, 'Help is needed');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.africastalking.com/version1/messaging',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    );

    const requestBody = global.fetch.mock.calls[0][1].body;
    expect(requestBody).toContain('username=sandbox');
    expect(requestBody).toContain('to=%2B2348011111111');
    expect(requestBody).toContain('message=Help+is+needed');
    expect(requestBody).toContain('from=Sentinel');
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
});
