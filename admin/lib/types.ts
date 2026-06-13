export interface AdminStats {
  totals: {
    users: number;
    alerts: number;
    contacts: number;
    trackingViews: number;
    activeAlerts: number;
    resolvedAlerts: number;
    cancelledAlerts: number;
    pushEnabledContacts: number;
  };
  alertsByStatus: Record<string, number>;
  contactsByStatus: Record<string, number>;
  notificationStats: Record<string, Record<string, number>>;
  signupsByDay: { date: string; count: number }[];
  alertsByDay: { date: string; count: number }[];
  recentAlerts: {
    id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    user_name: string;
    tracking_views: number;
  }[];
}
