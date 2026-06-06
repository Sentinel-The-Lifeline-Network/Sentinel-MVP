import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useSOS', () => ({
  useSOS: () => ({
    state: 'active',
    alert: {
      id: 'alert-1',
      status: 'active',
      started_at: new Date(Date.now() - 120000).toISOString(),
      tracking_token: 'test-token',
      last_latitude: 6.5244,
      last_longitude: 3.3792,
      last_location_timestamp: new Date().toISOString(),
    },
    error: null,
    markSafe: jest.fn(),
    stopAlert: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/LocationCard', () => ({ latitude, longitude }: any) => (
  <div data-testid="location-card">{latitude}, {longitude}</div>
));
jest.mock('@/components/EmergencyTimeline', () => () => <div data-testid="timeline" />);
jest.mock('@/components/PinConfirmModal', () => () => null);

import ActiveAlertPage from '@/app/active-alert/page';

describe('ActiveAlertPage', () => {
  it('renders SOS Alert Active indicator', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByText(/SOS Alert Active/i)).toBeInTheDocument();
  });

  it('renders Emergency Mode heading', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByText(/Emergency Mode/i)).toBeInTheDocument();
  });

  it('renders Mark Myself Safe button', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByText(/Mark Myself Safe/i)).toBeInTheDocument();
  });

  it('renders Stop Alert button', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByText(/Stop Alert/i)).toBeInTheDocument();
  });

  it('renders location card with coordinates', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByTestId('location-card')).toHaveTextContent('6.5244');
  });

  it('renders emergency timeline', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  it('renders share tracking link button', () => {
    render(<ActiveAlertPage />);
    expect(screen.getByText(/Share Live Tracking Link/i)).toBeInTheDocument();
  });
});
