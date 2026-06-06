jest.mock('../src/config/supabase', () => ({
  from: jest.fn(),
}));

jest.mock('../src/config', () => ({
  frontendUrl: 'http://localhost:3000',
  nodeEnv: 'test',
  notifications: {
    repeatIntervalMs: 5 * 60 * 1000,
    whatsappAccessToken: undefined,
    whatsappPhoneNumberId: undefined,
    resendApiKey: undefined,
    emailFrom: 'Sentinel <alerts@example.com>',
  },
}));

const supabase = require('../src/config/supabase');
const {
  startRecurringEmergencyNotifications,
  stopRecurringEmergencyNotifications,
  notifyAlertClosed,
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
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.RESEND_API_KEY;
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
      expect.arrayContaining(['whatsapp', 'email', 'whatsapp', 'email'])
    );
    expect(insert.mock.calls.map(([payload]) => payload.contact_id)).not.toContain('contact-disabled');
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
      expect.arrayContaining(['whatsapp', 'email'])
    );
  });
});
