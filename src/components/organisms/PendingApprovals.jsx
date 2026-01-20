import React from 'react';
import { Check, X, Eye } from 'lucide-react';
import Button from '../atoms/Button';
import StatusBadge from '../atoms/StatusBadge'; 

const PendingApprovals = () => {
  // Mock Data
  const requests = [
    { id: 1, name: "Success Academy", type: "Institute", date: "2025-10-12", status: "Pending" },
    { id: 2, name: "Mr. Amal Perera", type: "Tutor", date: "2025-10-12", status: "Pending" },
    { id: 3, name: "Wisdom Center", type: "Institute", date: "2025-10-11", status: "Reviewing" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-colors duration-200">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white">Pending Approvals</h3>
        <span className="text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
          {requests.length} New
        </span>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{req.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  req.type === 'Institute' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {req.type}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{req.date}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                className="p-1.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
                title="View Details"
              >
                <Eye size={16} />
              </button>
              <button 
                className="p-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" 
                title="Approve"
              >
                <Check size={16} />
              </button>
              <button 
                className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" 
                title="Reject"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
        
        {requests.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">No pending approvals.</p>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
         <Button variant="ghost" fullWidth size="small">View All Requests</Button>
      </div>
    </div>
  );
};

export default PendingApprovals;  