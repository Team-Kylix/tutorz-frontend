import React, { useState, useEffect } from 'react';
import { 
    Receipt, Download, CheckCircle, Clock, AlertCircle, 
    RefreshCw, Loader2, Info, Search, CreditCard
} from 'lucide-react';
import { getMyBills, downloadBillPdf } from '../../services/api/billingService';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import RowActions from '../../components/molecules/RowActions';
import BillPaymentModal from '../../components/organisms/BillPaymentModal';

const UserPlatformFinancePage = ({ setActivePage }) => {
    const [bills, setBills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Payment Modal State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

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

    const filteredBills = bills.filter(bill => 
        bill.billReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.monthYear.toLowerCase().includes(searchQuery.toLowerCase())
    );

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


            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Search by reference or month..."
                            className="pl-10 shadow-sm"
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

                <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 relative">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Reference</th>
                                <th className="px-6 py-4 font-semibold">Billing Period</th>
                                <th className="px-6 py-4 font-semibold text-right">Payable Amount</th>
                                <th className="px-6 py-4 font-semibold text-right">Paid Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-1 py-4 font-semibold sticky right-0 z-30 bg-gray-50 dark:bg-gray-700/50 backdrop-blur-sm"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50 dark:bg-gray-800/50"></td>
                                    </tr>
                                ))
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No invoices found.</td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.billId} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300">{bill.billReference}</td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{bill.monthYear}</td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white text-lg">
                                            Rs {bill.payableAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400 text-lg">
                                            {bill.paidAmount ? `Rs ${bill.paidAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(bill.status)}
                                        </td>
                                        <td className="px-1 py-4 sticky right-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                                            <RowActions actions={[
                                                { label: 'Download PDF', icon: Download, onClick: () => downloadBillPdf(bill.billId, bill.billReference) },
                                                ...(bill.status !== 'Paid' ? [{
                                                    label: 'Pay Bill', 
                                                    icon: CreditCard, 
                                                    onClick: () => { setSelectedBill(bill); setIsPayModalOpen(true); }
                                                }] : [])
                                            ]} />
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
            
            <BillPaymentModal 
                isOpen={isPayModalOpen}
                onClose={() => {
                    setIsPayModalOpen(false);
                    setSelectedBill(null);
                }}
                bill={selectedBill}
                onPaymentSuccess={fetchBills}
                setActivePage={setActivePage}
            />
        </div>
    );
};

export default UserPlatformFinancePage;
