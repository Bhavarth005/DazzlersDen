'use client'

import ActiveSessions, { ActiveSession } from "./components/dashboard/ActiveSessions";
import DashboardCard from "./components/dashboard/Card";
import { Timer, TrendingUp, IndianRupee, TriangleAlert, Loader2 } from "lucide-react"
import OverdueSessions, { OverdueSession } from "./components/dashboard/OverdueSessions";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// Helper to format ISO dates to "10:00 AM"
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeData, setActiveData] = useState<ActiveSession[]>([]);
  const [overdueData, setOverdueData] = useState<OverdueSession[]>([]);
  
  // Stats State
  const [stats, setStats] = useState({
    activeCount: 0,
    revenue: 0,
    pendingExits: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel Fetch: Stats + Active List + Overdue List
      const [statsRes, activeRes, overdueRes] = await Promise.all([
        fetch('/api/stats', { headers }),
        fetch('/api/dashboard/active', { headers }),
        fetch('/api/dashboard/overdue', { headers })
      ]);

      if (!statsRes.ok || !activeRes.ok || !overdueRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const statsData = await statsRes.json();
      const activeRaw = await activeRes.json();
      const overdueRaw = await overdueRes.json();

      console.log(activeRaw);

      // --- Process Active Sessions List ---
      const processedActive: ActiveSession[] = activeRaw.map((item: any) => ({
        id: item.id,
        name: item.customer.name,
        phoneNo: item.customer.mobileNumber,
        children: item.children,
        adults: item.adults,
        startTime: formatTime(item.startTime),
        endTime: formatTime(item.expectedEndTime),
      }));

      // --- Process Overdue Sessions List ---
      const now = new Date();
      const processedOverdue: OverdueSession[] = overdueRaw.map((item: any) => {
        const expectedEnd = new Date(item.expectedEndTime);
        const diffMs = now.getTime() - expectedEnd.getTime();
        const overdueMinutes = Math.floor(diffMs / 60000); 

        return {
          id: item.id,
          name: item.customer.name,
          phoneNo: item.customer.mobileNumber,
          children: item.children,
          adults: item.adults,
          startTime: formatTime(item.startTime),
          endTime: formatTime(item.expectedEndTime),
          overdueTime: overdueMinutes > 0 ? overdueMinutes : 0
        };
      });

      // --- Set State ---
      setActiveData(processedActive);
      setOverdueData(processedOverdue);
      
      // Use data directly from Stats API
      setStats({
        activeCount: statsData.active_sessions,
        revenue: statsData.monthly_revenue,
        pendingExits: statsData.overdue_sessions
      });

    } catch (error) {
      console.error(error);
      toast.error("Could not load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-300 mx-auto flex flex-col gap-8">

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          title="Active Sessions" 
          mainText={`${stats.activeCount}`}
          cardIcon={Timer} 
          subtext="Current customers" 
          subtextIcon={TrendingUp} />

        <DashboardCard 
          title="Monthly Revenue" 
          mainText={`₹${stats.revenue}`}
          cardIcon={IndianRupee} 
          subtext="Total recharges this month" 
          subtextIcon={TrendingUp} 
          accentColor="green" />

        <DashboardCard 
          title="Pending Exits" 
          mainText={`${stats.pendingExits}`}
          cardIcon={TriangleAlert} 
          subtext="Overdue Sessions" 
          subtextIcon={TriangleAlert} 
          accentColor="red" />
      </div>

      {/* Tables */}
      <ActiveSessions entries={activeData} refreshData={fetchDashboardData} />
      <OverdueSessions entries={overdueData} refreshData={fetchDashboardData} />
    </div>
  );
}