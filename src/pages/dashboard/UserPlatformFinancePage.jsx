import React, { useState, useEffect } from 'react';
import { 
    Receipt, Download, CheckCircle, Clock, AlertCircle, 
    RefreshCw, Loader2, Info
} from 'lucide-react';
import { getMyBills, downloadBillPdf } from '../../services/api/billingService';
import Button from '../../components/atoms/Button';

const UserPlatformFinancePage = () => {
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchBills = async () => {
        setIsLoading(true);
        const response = await getMyBills(page, 10);
        if (response.success) {
            setBills(response.data.items);
            setTotalCount(response.data.totalCount);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchBills();
    }, [page]);

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
                        <Receipt className="text-blue-500" /> Platform Finance
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and download your monthly platform usage invoices</p>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg shrink-0 h-fit">
                    <Info size={20} />
                </div>
                <div className="text-sm">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Billing Information</h3>
                    <p className="text-blue-800/70 dark:text-blue-200/60 mt-1">
                        Invoices are updated in real-time based on your platform usage. 
                        Your bill includes platform commissions, SMS dispatch costs, and API usage fees. 
                        Please settle any unpaid invoices to ensure uninterrupted service.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900 dark:text-white">Billing History</h2>
                    <button onClick={fetchBills} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Reference</th>
                                <th className="px-6 py-4 font-semibold">Billing Period</th>
                                <th className="px-6 py-4 font-semibold text-right">Payable Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-gray-50/50 dark:bg-gray-800/50"></td>
                                    </tr>
                                ))
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No invoices generated yet.</td>
                                </tr>
                            ) : (
                                bills.map((bill) => (
                                    <tr key={bill.billId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{bill.billReference}</td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{bill.monthYear}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white text-lg">
                                            Rs {bill.payableAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(bill.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => downloadBillPdf(bill.billId, bill.billReference)}
                                                className="inline-flex items-center gap-2"
                                            >
                                                <Download size={14} /> PDF
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalCount > 10 && (
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
                )}
            </div>
        </div>
    );
};

export default UserPlatformFinancePage;
