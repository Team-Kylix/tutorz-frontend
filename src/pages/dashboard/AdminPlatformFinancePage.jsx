import React, { useState, useEffect } from 'react';
import { 
    DollarSign, Search, Download, CheckCircle, Clock, AlertCircle, 
    Filter, RefreshCw, FileText, ChevronRight, Loader2, Play
} from 'lucide-react';
import { getAllBills, markBillAsPaid, downloadBillPdf } from '../../services/api/billingService';
import Button from '../../components/atoms/Button';
import SectionTitle from '../../components/atoms/SectionTitle';

const AdminPlatformFinancePage = () => {
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [actionStatus, setActionStatus] = useState({ type: '', message: '' });

    const fetchBills = async () => {
        setIsLoading(true);
        const response = await getAllBills(searchQuery, page, 10);
        if (response.success) {
            setBills(response.data.items);
            setTotalCount(response.data.totalCount);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchBills();
    }, [page, searchQuery]);



    const handleMarkPaid = async (billId) => {
        if (!window.confirm("Mark this bill as paid?")) return;
        
        const response = await markBillAsPaid(billId);
        if (response.success) {
            fetchBills();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><CheckCircle size={12}/> Paid</span>;
            case 'Overdue':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><AlertCircle size={12}/> Overdue</span>;
            default:
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit"><Clock size={12}/> Unpaid</span>;
        }
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="text-blue-500" /> Platform Finance
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monitor system-wide billing, API usage, and platform revenue</p>
                </div>
            </div>

            {actionStatus.message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium animate-in zoom-in-95 duration-300 ${
                    actionStatus.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {actionStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {actionStatus.message}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Reg ID, Mobile, Name or Reference..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchBills} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User / Email</th>
                                <th className="px-6 py-4 font-semibold">Reference</th>
                                <th className="px-6 py-4 font-semibold">Month</th>
                                <th className="px-6 py-4 font-semibold text-right">Payable</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50 dark:bg-gray-800/50"></td>
                                    </tr>
                                ))
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No bills found.</td>
                                </tr>
                            ) : (
                                bills.map((bill) => (
                                    <tr key={bill.billId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {bill.userName?.trim() ? bill.userName : bill.email}
                                            </div>
                                            <div className="text-xs text-gray-500">{bill.email}</div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">{bill.userRole}</div>
                                            {bill.registrationNumber && <div className="text-xs text-gray-400">Reg: {bill.registrationNumber}</div>}
                                            {bill.mobileNumber && <div className="text-xs text-gray-400">Mob: {bill.mobileNumber}</div>}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{bill.billReference}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{bill.monthYear}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            Rs {bill.payableAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(bill.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                                onClick={() => downloadBillPdf(bill.billId, bill.billReference)}
                                                className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download size={18} />
                                            </button>
                                            {bill.status !== 'Paid' && (
                                                <button 
                                                    onClick={() => handleMarkPaid(bill.billId)}
                                                    className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                                                    title="Mark as Paid"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
                    <div>Showing {bills.length} of {totalCount} bills</div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page === 1} 
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={page * 10 >= totalCount} 
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPlatformFinancePage;
