import React, { useState, useEffect } from 'react';
import { 
    Settings, Save, Loader2, MessageSquare, AlertCircle, Percent, 
    Zap, Phone, Calculator, ShieldCheck
} from 'lucide-react';
import { getBillingConfig, updateBillingConfig } from '../../services/api/billingService';
import Button from '../../components/atoms/Button';
import SectionTitle from '../../components/atoms/SectionTitle';

const AdminSystemConfigPage = () => {
    const [config, setConfig] = useState({
        apiCallRate: 0.01,
        smsRate: 2.00,
        platformCommissionRate: 1.00,
        vatPercentage: 0,
        ssclPercentage: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const fetchConfig = async () => {
            const response = await getBillingConfig();
            if (response.success) {
                setConfig(response.data);
            }
            setIsLoading(false);
        };
        fetchConfig();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus({ type: '', message: '' });

        const response = await updateBillingConfig(config);
        if (response.success) {
            setStatus({ type: 'success', message: 'System configuration updated successfully!' });
            setTimeout(() => setStatus({ type: '', message: '' }), 4000);
        } else {
            setStatus({ type: 'error', message: response.message || 'Failed to update configuration.' });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Settings className="text-gray-500" /> System Configuration
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage global billing rates, taxes, and platform parameters</p>
            </div>

            {status.message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
                    status.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {status.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {/* --- Usage Rates --- */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <SectionTitle title="Usage & Service Rates" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Zap size={16} className="text-amber-500" /> API Call Rate (LKR)
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={config.apiCallRate}
                                onChange={(e) => setConfig({ ...config, apiCallRate: parseFloat(e.target.value) })}
                            />
                            <p className="text-[10px] text-gray-500">Charged per request. Currently billed to Students.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Phone size={16} className="text-green-500" /> SMS Rate (LKR)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={config.smsRate}
                                onChange={(e) => setConfig({ ...config, smsRate: parseFloat(e.target.value) })}
                            />
                            <p className="text-[10px] text-gray-500">Standard cost for one dispatched SMS segment.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Percent size={16} className="text-blue-500" /> Platform Commission (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={config.platformCommissionRate}
                                onChange={(e) => setConfig({ ...config, platformCommissionRate: parseFloat(e.target.value) })}
                            />
                            <p className="text-[10px] text-gray-500">Standard platform cut taken from gross tuition fees.</p>
                        </div>
                    </div>
                </div>

                {/* --- Tax Settings --- */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <SectionTitle title="Tax Configuration" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calculator size={16} /> VAT Percentage (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={config.vatPercentage}
                                onChange={(e) => setConfig({ ...config, vatPercentage: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Calculator size={16} /> SSCL Percentage (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={config.ssclPercentage}
                                onChange={(e) => setConfig({ ...config, ssclPercentage: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-lg border border-amber-100 dark:border-amber-800/50 flex gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>Changes to tax percentages will apply to the next generated billing cycle. Current bills remain unaffected.</span>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving} className="w-full md:w-auto px-12">
                        {isSaving ? (
                            <><Loader2 size={18} className="animate-spin mr-2" /> Saving Configuration...</>
                        ) : (
                            <><Save size={18} className="mr-2" /> Save Changes</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AdminSystemConfigPage;
