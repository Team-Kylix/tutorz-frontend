import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import Button from '../../components/atoms/Button';
import SectionTitle from '../../components/atoms/SectionTitle';
import { getInstituteProfile, updateInstituteProfile } from '../../services/api/instituteService';

const SettingsPage = ({ user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        instituteName: '',
        address: '',
        contactNumber: '',
        website: '',
        isSmsEnabled: true
    });

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
            // Send the entire expected DTO model along with the new SMS flag
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

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSaveStatus({ type: '', message: '' });
                }, 3000);
            } else {
                setSaveStatus({ type: 'error', message: response.message || 'Failed to save settings.' });
            }
        } catch (error) {
            setSaveStatus({ type: 'error', message: error.message || 'An error occurred while saving.' });
        } finally {
            setIsSaving(false);
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

        </div>
    );
};

export default SettingsPage;