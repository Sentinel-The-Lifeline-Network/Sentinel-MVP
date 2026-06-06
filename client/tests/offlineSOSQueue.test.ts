import { offlineSOSQueue } from '@/utils/offlineSOSQueue';

describe('offlineSOSQueue', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores only one pending SOS to prevent duplicates', () => {
    const first = offlineSOSQueue.enqueue({ latitude: 6.5, longitude: 3.3 });
    const second = offlineSOSQueue.enqueue({ latitude: 7.1, longitude: 4.2 });

    expect(second.id).toBe(first.id);
    expect(offlineSOSQueue.all()).toHaveLength(1);
  });

  it('creates a local active alert for offline SOS state', () => {
    const request = offlineSOSQueue.enqueue({ latitude: 6.5, longitude: 3.3 });
    const alert = offlineSOSQueue.toLocalAlert(request);

    expect(alert.status).toBe('active');
    expect(alert.sync_status).toBe('pending');
    expect(alert.last_latitude).toBe(6.5);
    expect(alert.last_longitude).toBe(3.3);
  });
});
