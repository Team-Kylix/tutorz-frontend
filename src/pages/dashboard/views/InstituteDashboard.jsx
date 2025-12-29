import React from 'react';
import { 
  Users, GraduationCap, Calendar, DollarSign, 
  Plus, QrCode 
} from 'lucide-react';
import Button from '../../../components/atoms/Button';
import StatCard from '../../../components/molecules/StatCard';
import SectionTitle from '../../../components/atoms/SectionTitle';
import StatusBadge from '../../../components/atoms/StatusBadge'; 

// --- Mock Data ---
const MOCK_STATS = [
  { label: 'Total Tutors', value: '24', change: '+2 this month', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { label: 'Active Students', value: '856', change: '+12% vs last mo', icon: GraduationCap, color: 'text-green-600 bg-green-100' },
  { label: 'Classes Today', value: '42', change: '+8 Live Now', icon: Calendar, color: 'text-purple-600 bg-purple-100' },
  { label: 'Revenue (Dec)', value: 'Rs 12,450', change: '+5% growth', icon: DollarSign, color: 'text-indigo-600 bg-indigo-100' },
];

const InstituteDashboard = ({ user }) => {
  return (
    <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- Action Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Institute Overview</h1>
            <p className="text-sm text-gray-500">Welcome back, {user?.firstName || 'Admin'}</p>
         </div>
         <div className="flex gap-3">
           <Button variant="outline">
              <QrCode size={18} className="mr-2" /> Scan QR
           </Button>
           {/* Static Button: No onClick function */}
           <Button variant="primary">
              <Plus size={18} className="mr-2" /> Add New
           </Button>
         </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat, idx) => (
          <StatCard 
            key={idx} 
            label={stat.label} 
            value={stat.value} 
            icon={stat.icon} 
            color={stat.color} 
            change={stat.change} 
          />
        ))} 
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
             <div className="flex justify-between items-center mb-4">
                <SectionTitle title="Today's Classes" />
                <Button variant="ghost" size="small">View All</Button>
             </div>
             
             <div className="space-y-3">
               {[1, 2, 3].map((item) => (
                 <div key={item} className="flex items-center p-3 border border-gray-100 rounded-lg hover:border-blue-200 transition-colors">
                    {/* Time Box */}
                    <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center mr-4">
                      <span className="text-[10px] font-bold uppercase">MON</span>
                      <span className="text-sm font-bold">10:00</span>
                    </div>
                    {/* Details */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-sm">Advanced Mathematics</h4>
                      <p className="text-xs text-gray-500">By Dr. Sarah Wilson • Hall A</p>
                    </div>
                    {/* Badge */}
                    <StatusBadge status={item === 1 ? 'Live' : 'Upcoming'} />
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: New Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
           <div className="p-4 border-b border-gray-100">
             <h3 className="font-bold text-gray-900">New Registrations</h3>
           </div>
           
           <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                   <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      ST
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Student Name {i}</p>
                      <p className="text-[10px] text-gray-400">Joined today</p>
                   </div>
                   <StatusBadge status="New" className="!px-2 !py-0.5 text-[10px]" />
                </div>
              ))}
           </div>
           
           <div className="p-3 text-center border-t border-gray-100">
              <Button variant="ghost" size="small" fullWidth>View All Students</Button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default InstituteDashboard;