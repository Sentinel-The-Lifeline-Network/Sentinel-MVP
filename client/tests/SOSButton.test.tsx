import { render, screen, fireEvent } from '@testing-library/react';
import SOSButton from '@/components/SOSButton';

jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, ...rest }: any) => (
      <button onClick={onClick} disabled={disabled} {...rest}>{children}</button>
    ),
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('SOSButton', () => {
  it('renders SOS text', () => {
    render(<SOSButton state="idle" onPress={jest.fn()} />);
    expect(screen.getByText('SOS')).toBeInTheDocument();
  });

  it('calls onPress when idle and clicked', () => {
    const onPress = jest.fn();
    render(<SOSButton state="idle" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button', { name: /trigger sos/i }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled during activation', () => {
    render(<SOSButton state="activating" onPress={jest.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows sending text while activating', () => {
    render(<SOSButton state="activating" onPress={jest.fn()} />);
    expect(screen.getByText('SENDING')).toBeInTheDocument();
  });

  it('shows ACTIVE text when active', () => {
    render(<SOSButton state="active" onPress={jest.fn()} />);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('does not call onPress when active', () => {
    const onPress = jest.fn();
    render(<SOSButton state="active" onPress={onPress} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('has accessible aria-label', () => {
    render(<SOSButton state="idle" onPress={jest.fn()} />);
    expect(screen.getByLabelText(/trigger sos emergency alert/i)).toBeInTheDocument();
  });
});
