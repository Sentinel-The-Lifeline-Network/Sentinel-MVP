import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/contacts',
}));

jest.mock('@/hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [
      {
        id: '1',
        contact_name: 'Jane Doe',
        phone_number: '+2348012345678',
        relationship: 'Spouse',
        priority: 1,
        invite_status: 'pending_invite',
        invite_token: 'token123',
        invite_link: 'https://example.com/invite/token123',
        whatsapp_invite_sent_at: null,
        accepted_at: null,
        push_enabled: false,
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
    addContact: jest.fn().mockResolvedValue({}),
    updateContact: jest.fn().mockResolvedValue({}),
    removeContact: jest.fn().mockResolvedValue({}),
    resendInvite: jest.fn().mockResolvedValue({}),
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

  it('shows Guardian Circle heading', () => {
    render(<ContactsPage />);
    expect(screen.getByRole('heading', { name: /guardian circle/i })).toBeInTheDocument();
  });
});

describe('ContactCard', () => {
  const contact = {
    id: '1',
    contact_name: 'Jane Doe',
    phone_number: '+2348012345678',
    relationship: 'Spouse',
    priority: 1,
    invite_status: 'pending_invite' as const,
    invite_token: 'token123',
    invite_link: 'https://example.com/invite/token123',
    whatsapp_invite_sent_at: null,
    accepted_at: null,
    push_enabled: false,
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('renders contact name', () => {
    render(
      <ContactCard
        contact={contact}
        index={0}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onResendInvite={jest.fn()}
      />
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders relationship and phone', () => {
    render(
      <ContactCard
        contact={contact}
        index={0}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onResendInvite={jest.fn()}
      />
    );
    expect(screen.getByText(/Spouse/)).toBeInTheDocument();
  });

  it('shows resend invite action when expanded', () => {
    const onResendInvite = jest.fn();
    render(
      <ContactCard
        contact={contact}
        index={0}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
        onResendInvite={onResendInvite}
      />
    );
    fireEvent.click(screen.getByLabelText(/show contact actions/i));
    fireEvent.click(screen.getByText(/resend invite/i));
    expect(onResendInvite).toHaveBeenCalledWith('1');
  });
});
