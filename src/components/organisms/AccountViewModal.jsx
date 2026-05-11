import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import { User, GraduationCap, Briefcase, Phone, Mail, Award, CheckCircle2, ShieldCheck, MapPin, BadgeCheck } from 'lucide-react';
import { BASE_URL } from '../../services/api/apiClient';
import StudentQRCode from '../common/StudentQRCode';

const AccountViewModal = ({ isOpen, onClose, account }) => {
    if (!account) return null;

    const isStudent = account.role === 'Student';
    const isTutor = account.role === 'Tutor';
    
    // Dynamic color theming based on role
    const colorTheme = isStudent ? 'blue' : isTutor ? 'purple' : 'gray';

    const getProfileUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${BASE_URL}${url}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={account.role + " Profile"} maxWidth="max-w-2xl">
            <div className="flex flex-col relative">
                
                {/* 1. Header Banner */}
                <div className={`h-24 w-full bg-linear-to-r ${isStudent ? 'from-blue-600 to-blue-800' : isTutor ? 'from-purple-600 to-purple-800' : 'from-gray-600 to-gray-800'} rounded-xl relative overflow-visible mb-20`}>
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    
                    {/* Top Layer: Photo & QR in a Flex Container for absolute stability */}
                    <div className="absolute -bottom-12 left-0 right-0 px-6 flex justify-between items-end">
                        
                        {/* Square Profile Photo */}
                        <div className="w-28 h-28 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-xl ring-4 ring-black/5 dark:ring-white/5 transition-colors">
                            <div className={`w-full h-full rounded-xl bg-${colorTheme}-50 dark:bg-${colorTheme}-900 flex items-center justify-center overflow-hidden`}>
                                {getProfileUrl(account.profileImageUrlLarge || account.profileImageUrlSmall) ? (
                                    <img 
                                        src={getProfileUrl(account.profileImageUrlLarge || account.profileImageUrlSmall)} 
                                        alt={account.name} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span>${account.name?.charAt(0) || '?'}</span>`; }}
                                    />
                                ) : (
                                    <span className={`text-4xl font-bold text-${colorTheme}-600 dark:text-${colorTheme}-400 uppercase`}>
                                        {account.name?.charAt(0) || <User size={40} />}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* QR Code Container - Proportional scaling and baseline alignment */}
                        {account.registrationNumber && (
                            <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 transition-colors transform scale-85 md:scale-70 origin-bottom-right">
                                <StudentQRCode
                                    variant="compact"
                                    value={account.registrationNumber}
                                    studentName={account.name}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Content Area */}
                <div className="px-1 space-y-5">
                    {/* Identity Metadata - Positoned under the photo */}
                    <div className="pl-2 pt-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {account.name}
                            <BadgeCheck className={`text-${colorTheme}-500`} size={24} />
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-${colorTheme}-50 dark:bg-${colorTheme}-900/30 text-${colorTheme}-700 dark:text-${colorTheme}-400 border-${colorTheme}-100 dark:border-${colorTheme}-800`}>
                                {account.role} Member
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium font-mono">
                                REG ID: <span className="text-gray-700 dark:text-gray-300 font-bold">{account.registrationNumber}</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {/* Contact Card */}
                        <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest">General Contact</p>
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700"><Phone size={14} /></div>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{account.phoneNumber || 'Not provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700"><Mail size={14} /></div>
                                    <span className="truncate text-gray-700 dark:text-gray-200">{account.email || 'Not provided'}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700 mt-0.5"><MapPin size={14} /></div>
                                    <span className="flex-1 text-gray-700 dark:text-gray-200 leading-relaxed">{account.address || account.cityName || 'No address specified'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status/Academic Card */}
                        <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest">
                                {isStudent ? 'Academic Information' : 'Professional Background'}
                            </p>
                            <div className="space-y-4">
                                {isStudent && account.grade && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><GraduationCap size={20} /></div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Current Grade</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{account.grade}</p>
                                        </div>
                                    </div>
                                )}
                                {isTutor && account.experienceYears !== undefined && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"><Award size={20} /></div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Industry Experience</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{account.experienceYears} Years</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><ShieldCheck size={20} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Platform Status</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">Active Member</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <Button variant="secondary" onClick={onClose} className="px-8 font-bold rounded-xl py-2">
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AccountViewModal;
