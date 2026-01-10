'use client'

import ActiveSessions, { ActiveSession } from "./components/dashboard/ActiveSessions";
import DashboardCard from "./components/dashboard/Card";
import { Timer, TrendingUp, IndianRupee, TriangleAlert} from "lucide-react"
import OverdueSessions, { OverdueSession } from "./components/dashboard/OverdueSessions";
import { useState } from "react";

const activeEntries: ActiveSession[] = [
  {id: 1, name: "Umang Amrania", startTime: "10:00 AM", endTime: "12:00 PM", phoneNo: "+91 12345 12345"}
]
const overdueEntries: OverdueSession[] = []

export default function Dashboard() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [pendingExits, setPendingExits] = useState(0);

  const fetchDashboardData = () => {
    setActiveUsers(activeUsers + 1);
    setRevenue(revenue + 1);
    setPendingExits(pendingExits + 1);
  }

  return <>
    <div className="max-w-300 mx-auto flex flex-col gap-8">

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard 
          title="Active Sessions" 
          mainText={`${activeUsers}`}
          cardIcon={Timer} 
          subtext="+2 from last hour" 
          subtextIcon={TrendingUp} />

        <DashboardCard 
          title="Today's Revenue" 
          mainText={`₹${revenue}`}
          cardIcon={IndianRupee} 
          subtext="+15% from yesterday" 
          subtextIcon={TrendingUp} 
          accentColor="green" />

        <DashboardCard 
          title="Pending Exits" 
          mainText={`${pendingExits}`}
          cardIcon={TriangleAlert} 
          subtext="Action Required" 
          subtextIcon={TriangleAlert} 
          accentColor="red" />
      </div>

      {/* Active Sessions */}
      <ActiveSessions entries={activeEntries} />
      <OverdueSessions entries={overdueEntries} />
    </div>
  </>;
}
