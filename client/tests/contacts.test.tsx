import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/contacts',
}));

jest.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [
      {
        id: '1',
        full_name: 'Jane Doe',
        phone: '+2348012345678',
        relationship: 'Spouse',
        notification_enabled: true,
        email: null,
        user_id: 'user-1',
        created_at: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
    addContact: jest.fn().mockResolvedValue({}),
    updateContact: jest.fn().mockResolvedValue({}),
    removeContact: jest.fn().mockResolvedValue({}),
    reload: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('@/components/BottomNav', () => () => null);
jest.mock('@/components/PageTransition', () => ({ children }: any) => <>{children}</>);

import ContactsPage from '@/app/contacts/page';
import ContactCard from '@/components/ContactCard';

describe('ContactsPage', () => {
  it('renders contact list', () => {
    render(<ContactsPage />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows Contacts heading', () => {
    render(<ContactsPage />);
    expect(screen.getByRole('heading', { name: /contacts/i })).toBeInTheDocument();
  });
});

describe('ContactCard', () => {
  const contact = {
    id: '1',
    full_name: 'Jane Doe',
    phone: '+2348012345678',
    relationship: 'Spouse',
    notification_enabled: true,
    email: null,
    user_id: 'user-1',
    created_at: new Date().toISOString(),
  };

  it('renders contact name', () => {
    render(
      <ContactCard
        contact={contact}
        index={0}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders relationship and phone', () => {
    render(
      <ContactCard
        contact={contact}
        index={0}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    expect(screen.getByText(/Spouse/)).toBeInTheDocument();
  });

  it('calls onToggle when toggle is clicked', () => {
    const onToggle = jest.fn();
    render(
      <ContactCard
        contact={contact}
        index={0}
        onToggle={onToggle}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText(/disable notifications/i));
    expect(onToggle).toHaveBeenCalledWith('1', false);
  });
});
