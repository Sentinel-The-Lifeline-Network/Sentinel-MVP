import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const UsersIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 2 2 21h20L12 2z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const ActivityIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const CheckCircleIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>
);

export const XCircleIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M15 9 9 15" />
    <path d="M9 9l6 6" />
  </svg>
);

export const ContactsIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <circle cx="12" cy="10" r="3" />
    <path d="M8 18a4 4 0 0 1 8 0" />
  </svg>
);

export const BellIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const RefreshIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const LogoutIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);
