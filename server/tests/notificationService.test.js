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
    twilioWhatsappFrom: undefined,
  },
  firebase: {
    projectId: undefined,
    clientEmail: undefined,
    privateKey: undefined,
  },
}));

jest.mock('../src/services/whatsappService', () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue({ status: 'sent' }),
  buildSosAlertMessage: jest.fn(() => 'SOS ALERT MESSAGE'),
  buildActiveReminderMessage: jest.fn(() => '24H REMINDER MESSAGE'),
}));

jest.mock('../src/services/pushService', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ status: 'sent', provider: 'fcm' }),
  buildSosPushPayload: jest.fn(() => ({ title: 'SOS Push', body: 'sos push body', data: { url: 'http://track' } })),
  buildActiveReminderPushPayload: jest.fn(() => ({ title: 'Active Push', body: 'active push body', data: { url: 'http://track' } })),
  buildSafePushPayload: jest.fn(() => ({ title: 'Sentinel Update', body: 'safe push body', data: { url: 'http://track' } })),
  buildCancelledPushPayload: jest.fn(() => ({ title: 'Sentinel Alert Cancelled', body: 'cancelled push body', data: { url: 'http://track' } })),
  isConfigured: jest.fn(() => false),
}));

const supabase = require('../src/config/supabase');
const whatsappService = require('../src/services/whatsappService');
const pushService = require('../src/services/pushService');
const {
  startRecurringEmergencyNotifications,
  stopRecurringEmergencyNotifications,
  notifyAlertClosed,
} = require('../src/services/notificationService');

const repeatIntervalMs = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const alert = {
  id: 'alert-1',
  user_id: 'user-1',
  tracking_token: 'track-token',
  last_latitude: 6.5244,
  last_longitude: 3.3792,
  user_name: 'Test User',
  last_whatsapp_sent_at: null,
};

const contacts = [
  {
    id: 'contact-push-whatsapp',
    contact_name: 'Push And WhatsApp',
    phone_number: '+2348011111111',
    push_enabled: true,
    push_token: 'fcm-token-1',
  },
  {
    id: 'contact-whatsapp-only',
    contact_name: 'WhatsApp Only',
    phone_number: '+2348022222222',
    push_enabled: false,
    push_token: null,
  },
];

const setupSupabase = ({
  activeAlert = alert,
  recurringContacts = contacts,
  emergencyContactsUpdate,
  sosAlertsUpdateEq,
} = {}) => {
  const insert = jest.fn().mockResolvedValue({ error: null });

  const alertUpdateEq = sosAlertsUpdateEq || jest.fn().mockResolvedValue({ error: null });
  const alertUpdate = jest.fn().mockReturnValue({ eq: alertUpdateEq });

  const alertQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: activeAlert, error: null }),
    update: alertUpdate,
  };

  const contactsQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: recurringContacts, error: null }),
    update: emergencyContactsUpdate || jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
  };

  supabase.from.mockImplementation((table) => {
    if (table === 'notifications_log') return { insert };
    if (table === 'sos_alerts') return alertQuery;
    if (table === 'emergency_contacts') return contactsQuery;
    throw new Error(`Unexpected table: ${table}`);
  });

  return { insert, alertQuery, contactsQuery, alertUpdate, alertUpdateEq };
};

describe('notificationService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    whatsappService.sendWhatsAppMessage.mockResolvedValue({ status: 'sent' });
    pushService.sendPushNotification.mockResolvedValue({ status: 'sent', provider: 'fcm' });
  });

  afterEach(() => {
    stopRecurringEmergencyNotifications(alert.id);
    jest.useRealTimers();
  });

  it('sends whatsapp and push to contacts on SOS start and records last_whatsapp_sent_at', async () => {
    const { insert, alertUpdate, alertUpdateEq } = setupSupabase();

    await startRecurringEmergencyNotifications(alert, contacts);

    // contact-push-whatsapp gets whatsapp + push, contact-whatsapp-only gets whatsapp only = 3 deliveries
    expect(insert).toHaveBeenCalledTimes(3);

    const channels = insert.mock.calls.map(([payload]) => payload.channel);
    expect(channels).toEqual(expect.arrayContaining(['push', 'whatsapp', 'whatsapp']));

    expect(whatsappService.buildSosAlertMessage).toHaveBeenCalled();
    expect(pushService.buildSosPushPayload).toHaveBeenCalled();
    expect(pushService.sendPushNotification).toHaveBeenCalledWith('fcm-token-1', expect.any(Object));
    expect(whatsappService.sendWhatsAppMessage).toHaveBeenCalledWith('+2348011111111', 'SOS ALERT MESSAGE');
    expect(whatsappService.sendWhatsAppMessage).toHaveBeenCalledWith('+2348022222222', 'SOS ALERT MESSAGE');

    expect(alertUpdate).toHaveBeenCalledWith({ last_whatsapp_sent_at: expect.any(String) });
    expect(alertUpdateEq).toHaveBeenCalledWith('id', alert.id);
  });

  it('logs a failed push notification without blocking the whatsapp send', async () => {
    pushService.sendPushNotification.mockResolvedValueOnce({ status: 'failed', message: 'Push error' });
    const { insert } = setupSupabase();

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));

    const pushLog = insert.mock.calls.find(([payload]) => payload.channel === 'push')[0];
    const whatsappLog = insert.mock.calls.find(([payload]) => payload.channel === 'whatsapp')[0];

    expect(pushLog.status).toBe('failed');
    expect(pushLog.error_message).toBe('Push error');
    expect(whatsappLog.status).toBe('sent');
  });

  it('disables push for the contact when the push token is invalid', async () => {
    pushService.sendPushNotification.mockResolvedValueOnce({ status: 'failed', message: 'not registered', tokenInvalid: true });
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const emergencyContactsUpdate = jest.fn().mockReturnValue({ eq: updateEq });
    setupSupabase({ recurringContacts: contacts.slice(0, 1), emergencyContactsUpdate });

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));

    expect(emergencyContactsUpdate).toHaveBeenCalledWith({ push_enabled: false, invite_status: 'push_disabled' });
    expect(updateEq).toHaveBeenCalledWith('id', 'contact-push-whatsapp');
  });

  it('logs a failed whatsapp delivery', async () => {
    whatsappService.sendWhatsAppMessage.mockRejectedValueOnce(new Error('WhatsApp down'));
    const { insert } = setupSupabase({ recurringContacts: contacts.slice(1, 2) });

    await startRecurringEmergencyNotifications(alert, contacts.slice(1, 2));

    const whatsappLog = insert.mock.calls.find(([payload]) => payload.channel === 'whatsapp')[0];
    expect(whatsappLog.status).toBe('failed');
    expect(whatsappLog.error_message).toBe('WhatsApp down');
  });

  it('sends push-only reminders every 5 minutes and does not resend whatsapp within 24 hours', async () => {
    const recentAlert = { ...alert, last_whatsapp_sent_at: new Date().toISOString() };
    const { insert, alertQuery, contactsQuery } = setupSupabase({
      activeAlert: recentAlert,
      recurringContacts: contacts.slice(0, 1),
    });

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));
    insert.mockClear();
    whatsappService.sendWhatsAppMessage.mockClear();

    await jest.advanceTimersByTimeAsync(repeatIntervalMs);

    expect(alertQuery.maybeSingle).toHaveBeenCalledTimes(1);
    expect(contactsQuery.order).toHaveBeenCalledTimes(1);
    expect(pushService.buildActiveReminderPushPayload).toHaveBeenCalled();
    expect(whatsappService.buildActiveReminderMessage).not.toHaveBeenCalled();
    expect(whatsappService.sendWhatsAppMessage).not.toHaveBeenCalled();

    const channels = insert.mock.calls.map(([payload]) => payload.channel);
    expect(channels).toEqual(['push']);
  });

  it('sends a whatsapp reminder after 24 hours while the incident remains active', async () => {
    const staleAlert = { ...alert, last_whatsapp_sent_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() };
    const { insert, alertUpdate, alertUpdateEq } = setupSupabase({
      activeAlert: staleAlert,
      recurringContacts: contacts.slice(1, 2),
    });

    await startRecurringEmergencyNotifications(alert, contacts.slice(1, 2));
    insert.mockClear();
    alertUpdate.mockClear();
    alertUpdateEq.mockClear();

    await jest.advanceTimersByTimeAsync(repeatIntervalMs);

    expect(whatsappService.buildActiveReminderMessage).toHaveBeenCalled();
    const channels = insert.mock.calls.map(([payload]) => payload.channel);
    expect(channels).toEqual(['whatsapp']);
    expect(alertUpdate).toHaveBeenCalledWith({ last_whatsapp_sent_at: expect.any(String) });
    expect(alertUpdateEq).toHaveBeenCalledWith('id', alert.id);

    expect(Date.now() - new Date(staleAlert.last_whatsapp_sent_at).getTime()).toBeGreaterThan(DAY_MS);
  });

  it('stops scheduled notifications and sends a push-only safe update with no whatsapp when resolved', async () => {
    const { insert, alertQuery } = setupSupabase({ recurringContacts: contacts.slice(0, 1) });

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));
    insert.mockClear();
    whatsappService.sendWhatsAppMessage.mockClear();

    await notifyAlertClosed(alert, contacts.slice(0, 1), 'resolved');
    await jest.advanceTimersByTimeAsync(repeatIntervalMs);

    expect(alertQuery.maybeSingle).not.toHaveBeenCalled();
    expect(pushService.buildSafePushPayload).toHaveBeenCalled();
    expect(whatsappService.sendWhatsAppMessage).not.toHaveBeenCalled();

    const channels = insert.mock.calls.map(([payload]) => payload.channel);
    expect(channels).toEqual(['push']);
  });

  it('stops scheduled notifications and sends a push-only cancelled update with no whatsapp', async () => {
    const { insert, alertQuery } = setupSupabase({ recurringContacts: contacts.slice(0, 1) });

    await startRecurringEmergencyNotifications(alert, contacts.slice(0, 1));
    insert.mockClear();
    whatsappService.sendWhatsAppMessage.mockClear();

    await notifyAlertClosed(alert, contacts.slice(0, 1), 'cancelled');
    await jest.advanceTimersByTimeAsync(repeatIntervalMs);

    expect(alertQuery.maybeSingle).not.toHaveBeenCalled();
    expect(pushService.buildCancelledPushPayload).toHaveBeenCalled();
    expect(whatsappService.sendWhatsAppMessage).not.toHaveBeenCalled();

    const channels = insert.mock.calls.map(([payload]) => payload.channel);
    expect(channels).toEqual(['push']);
  });
});
