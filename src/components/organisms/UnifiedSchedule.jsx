import React, { useEffect, useState } from 'react';
import { Calendar, ArrowRight, Clock, Users, GraduationCap, Building2, Banknote, Presentation, PenTool, BookOpen, MapPin, User, CheckCircle, Radio } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { getClassStatus, getDayIndex } from '../../utils/scheduleHelpers';

const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diffM = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffM < 0) diffM += 24 * 60; // Handle midnight crossing
    const hours = Math.floor(diffM / 60);
    const mins = diffM % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
};

const getTypeIcon = (type) => {
    switch (type) {
        case 'Seminar': return <Presentation size={14} className="text-purple-500" />;
        case 'Workshop': return <PenTool size={14} className="text-orange-500" />;
        case 'Course': return <GraduationCap size={14} className="text-emerald-500" />;
        default: return <BookOpen size={14} className="text-blue-500" />;
    }
};

const EMPTY_ARRAY = [];

const UnifiedSchedule = ({ 
    classes = EMPTY_ARRAY, 
    isLoading = false, 
    onNavigate, 
    title = "My Schedule",
    fetchClassesApi = null
}) => {
    const [internalClasses, setInternalClasses] = useState([]);
    const [displayList, setDisplayList] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const { request: fetchClasses, loading: isFetching } = useApi();

    // 1. Load Data
    useEffect(() => {
        const loadData = async () => {
            // Priority: If fetchClassesApi is provided and classes array is empty, we self-fetch.
            // This sustains compatibility with TutorDashboard which doesn't pre-fetch yet.
            if (fetchClassesApi) {
                const { data } = await fetchClasses(fetchClassesApi);
                if (data) {
                    let classesArray = [];
                    if (Array.isArray(data)) classesArray = data;
                    else if (data.items && Array.isArray(data.items)) classesArray = data.items;
                    else if (data.data && Array.isArray(data.data)) classesArray = data.data;
                    setInternalClasses(classesArray);
                }
            } else {
                setInternalClasses(classes);
            }
        };
        loadData();
    }, [classes, fetchClassesApi]); // eslint-disable-line react-hooks/exhaustive-deps

    // 2. Timer Tick (Every 1 second to update countdowns smoothly)
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 3. Process, Sort, and Priority
    useEffect(() => {
        if (internalClasses.length === 0) {
            setDisplayList([]);
            return;
        }

        const todayIndex = new Date().getDay();
        const processed = internalClasses.map(cls => {
            const status = getClassStatus(cls); // uses system time inside
            const dayIndex = getDayIndex(cls.dayOfWeek);

            let priority = 3;
            if (status === 'in-progress') priority = 0;
            else if (status === 'next') priority = 1;
            else if (status === 'completed') priority = 2;

            if (dayIndex !== todayIndex && dayIndex !== -1) priority = 3;

            return { ...cls, status, priority };
        });

        const sorted = processed.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return (a.startTime || "").localeCompare(b.startTime || "");
        });

        setDisplayList(sorted.slice(0, 5));
    }, [internalClasses, currentTime]); // Re-evaluate when time jumps or data changes

    // Countdown Helper
    const getCountdownNode = (cls) => {
        if (cls.status !== 'next' && cls.status !== 'in-progress') return null;
        
        try {
            const now = currentTime;
            const [startH, startM] = (cls.startTime || "00:00").split(':').map(Number);
            const [endH, endM] = (cls.endTime || "23:59").split(':').map(Number);

            if (cls.status === 'next') {
                const startObj = new Date(now);
                startObj.setHours(startH, startM, 0, 0);
                let diffMs = startObj - now;
                if (diffMs < 0) return null;
                
                const h = Math.floor(diffMs / 3600000);
                const m = Math.floor((diffMs % 3600000) / 60000);
                const s = Math.floor((diffMs % 60000) / 1000);
                const text = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
                
                return (
                    <span className="text-blue-600 dark:text-blue-400 font-bold ml-1">
                        Starts in {text}
                    </span>
                );
            } else if (cls.status === 'in-progress') {
                const endObj = new Date(now);
                endObj.setHours(endH, endM, 0, 0);
                let diffMs = endObj - now;
                if (diffMs < 0) return null;

                const h = Math.floor(diffMs / 3600000);
                const m = Math.floor((diffMs % 3600000) / 60000);
                const s = Math.floor((diffMs % 60000) / 1000);
                const text = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;

                return (
                    <span className="text-red-500 font-bold ml-1 animate-pulse">
                        Ends in {text}
                    </span>
                );
            }
        } catch { return null; }
        return null;
    };

    const getStatusIndicator = (status) => {
        switch (status) {
            case 'in-progress':
                return <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] font-bold uppercase tracking-wider"><Radio size={10} /> Live</div>;
            case 'completed':
                return <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded text-[10px] font-bold uppercase tracking-wider"><CheckCircle size={10} /> Done</div>;
            case 'next':
                return <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-[10px] font-bold uppercase tracking-wider"><Clock size={10} /> Next</div>;
            default: return null;
        }
    };

    const showLoading = isLoading || isFetching;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-colors">
            
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                    {title}
                </h3>
                {onNavigate && (
                    <button onClick={onNavigate} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
                        View All <ArrowRight size={16} />
                    </button>
                )}
            </div>
            
            {/* Body */}
            <div className="p-4 md:p-5 flex-1 overflow-y-auto custom-scrollbar">
                {showLoading ? (
                    <div className="text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center justify-center h-full py-8">
                        <Clock size={24} className="animate-spin text-blue-500 mb-2" />
                        <p>Loading schedule...</p>
                    </div>
                ) : displayList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full opacity-70">
                        <Calendar size={48} className="mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="font-medium">No classes scheduled right now.</p>
                        <p className="text-xs mt-1">Enjoy your free time!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayList.map((cls, idx) => {
                            const isLive = cls.status === 'in-progress';
                            
                            return (
                                <div key={cls.classId || cls.id || idx} className={`flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 rounded-xl transition-all border 
                                    ${isLive 
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40 shadow-sm' 
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'}`}>
                                    
                                    {/* Left: Time & Icon Box */}
                                    <div className="flex sm:flex-col items-center justify-between sm:justify-center flex-shrink-0 sm:w-20 sm:h-20 sm:rounded-lg gap-2 sm:gap-0
                                        sm:bg-gray-50 sm:dark:bg-gray-700/50">
                                        <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isLive ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {cls.dayOfWeek ? cls.dayOfWeek.substring(0, 3) : 'DAY'}
                                            </span>
                                            <span className={`text-base sm:text-lg font-black leading-none ${isLive ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                {cls.startTime?.split(' ')[0] || '--:--'}
                                            </span>
                                        </div>
                                        <div className="hidden sm:flex mt-1">
                                            {getStatusIndicator(cls.status)}
                                        </div>
                                    </div>

                                    {/* Middle: Main Details */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2 pr-2 overflow-hidden">
                                                {getTypeIcon(cls.classType || cls.type)}
                                                {/* Desktop: Show full name */}
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-[15px] hidden sm:block">
                                                    {cls.className || cls.subject || 'Standard Class'}
                                                </h4>
                                                {/* Mobile: Show Grade - Subject only */}
                                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-[15px] sm:hidden">
                                                    {cls.grade && <span className="mr-1">{cls.grade}</span>}
                                                    {cls.subject || cls.className || 'Class'}
                                                </h4>
                                            </div>
                                            <div className="sm:hidden flex-shrink-0">
                                                {getStatusIndicator(cls.status)}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center text-[11px] text-gray-600 dark:text-gray-400 gap-x-3 gap-y-1 mt-1 font-medium">
                                            {cls.grade && (
                                                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                                    {cls.grade}
                                                </span>
                                            )}
                                            {cls.instituteName && (
                                                <span className="flex items-center gap-1 truncate max-w-[120px]" title={cls.instituteName}>
                                                    <Building2 size={12} className="text-gray-400" /> {cls.instituteName}
                                                </span>
                                            )}
                                            {(cls.tutorName || cls.tutorFirstName) && (
                                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                    <User size={12} className="text-gray-400" /> {cls.tutorName || cls.tutorFirstName}
                                                </span>
                                            )}
                                            {cls.hallName && (
                                                <span className="flex items-center gap-1 truncate max-w-[100px]">
                                                    <MapPin size={12} className="text-gray-400" /> {cls.hallName}
                                                </span>
                                            )}
                                            {/* Unified Data Requirement: Fee */}
                                            {cls.fee !== undefined && cls.fee !== null && (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                    <Banknote size={12} /> Rs.{cls.fee}
                                                </span>
                                            )}
                                        </div>

                                        {/* Bottom Row: Students & Countdown */}
                                        <div className="flex justify-between items-end mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/50">
                                            <div className="flex items-center gap-3 text-[11px]">
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <Clock size={12} /> {calculateDuration(cls.startTime, cls.endTime)}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-500" title="Enrolled Students">
                                                    <Users size={12} /> {cls.studentCount ?? 0}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-right">
                                                {getCountdownNode(cls)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnifiedSchedule;
