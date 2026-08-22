export interface DashboardKpiSummary {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  todayRegistrations: number;
  todayCheckins: number;
  activeHosts: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  registrations: number;
}

export class AnalyticsService {
  /**
   * Calculates dashboard summary KPIs
   */
  static getMockKpis(): DashboardKpiSummary {
    return {
      totalEvents: 42,
      upcomingEvents: 12,
      totalRegistrations: 1450,
      totalRevenue: 485000,
      todayRegistrations: 38,
      todayCheckins: 94,
      activeHosts: 18,
    };
  }

  /**
   * Monthly/Daily sales & attendance chart points
   */
  static getMockChartData(): RevenueChartPoint[] {
    return [
      { date: 'Mon', revenue: 24000, registrations: 45 },
      { date: 'Tue', revenue: 32000, registrations: 60 },
      { date: 'Wed', revenue: 28000, registrations: 52 },
      { date: 'Thu', revenue: 45000, registrations: 85 },
      { date: 'Fri', revenue: 78000, registrations: 140 },
      { date: 'Sat', revenue: 110000, registrations: 210 },
      { date: 'Sun', revenue: 95000, registrations: 180 },
    ];
  }
}
