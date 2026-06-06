import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/history',
}));

jest.mock('@/services/sosService', () => ({
  sosService: {
    getHistory: jest.fn().mockResolvedValue([
      {
        id: '1',
        status: 'resolved',
        started_at: '2025-01-15T10:00:00Z',
        ended_at: '2025-01-15T10:15:00Z',
        last_latitude: 6.5244,
        last_longitude: 3.3792,
        tracking_token: 'abc',
        user_id: 'u1',
        created_at: '2025-01-15T10:00:00Z',
        last_location_timestamp: null,
      },
      {
        id: '2',
        status: 'cancelled',
        started_at: '2025-01-10T08:00:00Z',
        ended_at: '2025-01-10T08:02:00Z',
        last_latitude: null,
        last_longitude: null,
        tracking_token: 'xyz',
        user_id: 'u1',
        created_at: '2025-01-10T08:00:00Z',
        last_location_timestamp: null,
      },
    ]),
  },
}));

jest.mock('@/components/BottomNav', () => () => null);
jest.mock('@/components/PageTransition', () => ({ children }: any) => <>{children}</>);
jest.mock('framer-motion', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import HistoryPage from '@/app/history/page';

describe('HistoryPage', () => {
  it('renders History heading', async () => {
    render(<HistoryPage />);
    expect(screen.getByText('History')).toBeInTheDocument();
  });
});
