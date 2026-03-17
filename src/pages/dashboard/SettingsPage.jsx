import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, MessageSquare, AlertCircle, Percent } from 'lucide-react';
import Button from '../../components/atoms/Button';
import SectionTitle from '../../components/atoms/SectionTitle';
import { getInstituteProfile, updateInstituteProfile, updateCommission } from '../../services/api/instituteService';

const SettingsPage = ({ user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingCommission, setIsSavingCommission] = useState(false);
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
    const [commissionStatus, setCommissionStatus] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        instituteName: '',
        address: '',
        contactNumber: '',
        website: '',
        isSmsEnabled: true
    });
    const [commissionPercentage, setCommissionPercentage] = useState(0);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user?.userId) {
                try {
                    const response = await getInstituteProfile(user.userId);
                    if (response.success && response.data) {
                        setFormData({
                            instituteName: response.data.instituteName || '',
                            address: response.data.address || '',
                            contactNumber: response.data.contactNumber || '',
                            website: response.data.website || '',
                            isSmsEnabled: response.data.isSmsEnabled ?? true
                        });
                        setCommissionPercentage(Number(response.data.commissionPercentage ?? 0));
                    }
                } catch (error) {
                    console.error("Failed to load settings", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchSettings();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveStatus({ type: '', message: '' });

        try {
            const payload = {
                instituteName: formData.instituteName,
                address: formData.address,
                contactNumber: formData.contactNumber,
                website: formData.website,
                isSmsEnabled: formData.isSmsEnabled
            };

            const response = await updateInstituteProfile(payload);

            if (response.success) {
                setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
                setTimeout(() => setSaveStatus({ type: '', message: '' }), 3000);
            } else {
                setSaveStatus({ type: 'error', message: response.message || 'Failed to save settings.' });
            }
        } catch (error) {
            setSaveStatus({ type: 'error', message: error.message || 'An error occurred while saving.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveCommission = async (e) => {
        e.preventDefault();
        const val = Number(commissionPercentage);
        if (isNaN(val) || val < 0 || val > 100) {
            setCommissionStatus({ type: 'error', message: 'Please enter a value between 0 and 100.' });
            return;
        }
        setIsSavingCommission(true);
        setCommissionStatus({ type: '', message: '' });

        try {
            const response = await updateCommission({ commissionPercentage: val });
            if (response.success) {
                setCommissionStatus({ type: 'success', message: 'Commission percentage updated successfully!' });
                setTimeout(() => setCommissionStatus({ type: '', message: '' }), 3000);
            } else {
                setCommissionStatus({ type: 'error', message: response.message || 'Failed to update commission.' });
            }
        } catch (error) {
            setCommissionStatus({ type: 'error', message: error.message || 'An error occurred.' });
        } finally {
            setIsSavingCommission(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative max-w-4xl mx-auto">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="text-gray-500" /> Institute Settings
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Configure your institute's global parameters</p>
                </div>
            </div>

            {/* --- SMS Settings --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <SectionTitle title="Communication Settings" />

                <form onSubmit={handleSave} className="space-y-6 mt-6">

                    <div className="p-5 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Automated Welcome SMS</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
                                            When enabled, the system will automatically dispatch an SMS containing login credentials and a link to Tutorz.lk whenever you register a new Student or Tutor via the dashboard. Disabling this saves SMS credits.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer m-4 shrink-0">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.isSmsEnabled}
                                            onChange={(e) => setFormData({ ...formData, isSmsEnabled: e.target.checked })}
                                        />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                                {!formData.isSmsEnabled && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50">
                                        <AlertCircle size={16} />
                                        <span>Welcome SMS dispatch is currently <b>Disabled</b>. New accounts will not be notified by the server.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {saveStatus.message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${saveStatus.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                            }`}>
                            <span>{saveStatus.message}</span>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto px-8">
                            {isSaving ? (
                                <><Loader2 size={18} className="animate-spin mr-2" /> Saving changes...</>
                            ) : (
                                <><Save size={18} className="mr-2" /> Save Settings</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* --- Commission & Revenue Settings --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <SectionTitle title="Commission & Revenue Settings" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
                    Set the percentage of class fee revenue your institute receives. This will be reflected on your dashboard revenue summary.
                </p>

                <form onSubmit={handleSaveCommission} className="space-y-6">
                    <div className="p-5 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                <Percent className="text-indigo-600 dark:text-indigo-400" size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Institute Commission Rate</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                                    Enter the percentage (0–100) of gross class fee revenue that the institute receives. For example, if a class generates Rs&nbsp;10,000 and your rate is 25%, your net revenue will be Rs&nbsp;2,500.
                                </p>
                                <div className="flex items-center gap-3 max-w-xs">
                                    <input
                                        id="commissionPercentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={commissionPercentage}
                                        onChange={(e) => setCommissionPercentage(e.target.value)}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        placeholder="e.g. 25"
                                    />
                                    <span className="text-lg font-bold text-gray-500 dark:text-gray-400">%</span>
                                </div>

                                {Number(commissionPercentage) > 0 && (
                                    <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                        Your institute receives <b>{commissionPercentage}%</b> of all class fee revenue.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {commissionStatus.message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${commissionStatus.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                            }`}>
                            <span>{commissionStatus.message}</span>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button type="submit" disabled={isSavingCommission} className="w-full sm:w-auto px-8">
                            {isSavingCommission ? (
                                <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</>
                            ) : (
                                <><Save size={18} className="mr-2" /> Save Commission Rate</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default SettingsPage;