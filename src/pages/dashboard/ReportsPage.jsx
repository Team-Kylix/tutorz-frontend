import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, FileBarChart2, RefreshCw } from 'lucide-react';
import Select from '../../components/atoms/Select';
import ReportsTable from '../../components/organisms/ReportsTable';
import {
    getClasses,
    getJoinedInstitutes,
    getTutorMonthlyReport,
    downloadTutorMonthlyReportPdf,
} from '../../services/api/tutorService';

const ReportsPage = () => {
    // ─── Dropdown Data ────────────────────────────────────────────
    const [institutes, setInstitutes] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

    // ─── Selection ────────────────────────────────────────────────
    // '' = All Institutes, 'own' = My Own Place, GUID = specific
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');

    // ─── Report Data ──────────────────────────────────────────────
    const [reportRows, setReportRows] = useState([]);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [error, setError] = useState(null);

    // ─── Download tracking ────────────────────────────────────────
    const [downloadingRef, setDownloadingRef] = useState(null);

    // ─── Fetch Dropdown Data on mount ────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoadingDropdowns(true);
            try {
                const [instRes, clsRes] = await Promise.all([
                    getJoinedInstitutes(),
                    getClasses(),
                ]);

                const instData = instRes?.data ?? instRes;
                setInstitutes(
                    Array.isArray(instData) ? instData : (instData?.data ?? [])
                );

                const clsData = clsRes?.data ?? clsRes;
                setAllClasses(
                    Array.isArray(clsData) ? clsData : (clsData?.data ?? clsData?.items ?? [])
                );
            } catch (err) {
                console.error('Failed to load dropdown data:', err);
            } finally {
                setIsLoadingDropdowns(false);
            }
        };
        load();
    }, []);

    // ─── Derived: classes filtered by selected institute ──────────
    const availableClasses = useMemo(() => {
        if (!selectedInstituteId) return allClasses;
        if (selectedInstituteId === 'own') return allClasses.filter(c => !c.instituteId);
        return allClasses.filter(c => c.instituteId === selectedInstituteId);
    }, [selectedInstituteId, allClasses]);

    // Reset class when institute changes
    useEffect(() => {
        setSelectedClassId('');
    }, [selectedInstituteId]);

    // ─── Fetch Report Data ────────────────────────────────────────
    const fetchReport = useCallback(async () => {
        setIsLoadingReport(true);
        setError(null);
        try {
            const res = await getTutorMonthlyReport(
                selectedInstituteId || null,
                selectedClassId || null
            );
            const rows = res?.data?.rows ?? res?.rows ?? [];
            setReportRows(rows);
        } catch (err) {
            console.error('Failed to fetch monthly report:', err);
            setError('Failed to load report data. Please try again.');
            setReportRows([]);
        } finally {
            setIsLoadingReport(false);
        }
    }, [selectedInstituteId, selectedClassId]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // ─── Download Handler ─────────────────────────────────────────
    const handleDownload = async (row) => {
        if (downloadingRef) return;
        setDownloadingRef(row.reference);
        try {
            const filename = `Tutorz_Report_${(row.monthYear || '').replace(/\s+/g, '_')}.pdf`;
            await downloadTutorMonthlyReportPdf(
                selectedInstituteId || null,
                selectedClassId || null,
                row.month,
                row.year,
                filename
            );
        } finally {
            setDownloadingRef(null);
        }
    };

    // ─── Render ───────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileBarChart2 className="h-6 w-6 text-indigo-500" />
                        Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        View monthly class reports across your institutes and classes.
                    </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                        onClick={fetchReport}
                        disabled={isLoadingReport}
                        className="w-full sm:w-auto flex justify-center items-center p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={17} className={isLoadingReport ? 'animate-spin' : ''} />
                        <span className="ml-2 sm:hidden">Refresh Data</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">

                {/* Select Institute */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Institute
                    </label>
                    <Select
                        value={selectedInstituteId}
                        onChange={e => setSelectedInstituteId(e.target.value)}
                        disabled={isLoadingDropdowns}
                    >
                        <option value="">-- All Institutes --</option>
                        <option value="own">My Own Place</option>
                        {institutes.map(inst => {
                            const iId = inst.instituteId ?? inst.id;
                            return (
                                <option key={iId} value={iId}>
                                    {inst.name ?? inst.instituteName ?? `Institute ${String(iId).substring(0, 4)}`}
                                </option>
                            );
                        })}
                    </Select>
                </div>

                {/* Select Class */}
                <div className="w-full md:w-1/3 flex flex-col items-start gap-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Class
                    </label>
                    <Select
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                        disabled={isLoadingDropdowns}
                    >
                        <option value="">-- All Classes --</option>
                        {availableClasses.map(cls => {
                            const cId = cls.classId ?? cls.id;
                            return (
                                <option key={cId} value={cId}>
                                    {cls.className ?? cls.name ?? cls.subject ?? `Class ${String(cId).substring(0, 4)}`}
                                </option>
                            );
                        })}
                    </Select>
                </div>

                {/* Info chip */}
                <div className="w-full md:flex-1 flex items-end pb-0.5">
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Showing months where at least one student attended class.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="mt-4">
                {isLoadingReport ? (
                    <div className="flex justify-center items-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-3 text-gray-500 dark:text-gray-400">Loading report data…</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p>{error}</p>
                    </div>
                ) : (
                    <ReportsTable
                        rows={reportRows}
                        onDownload={handleDownload}
                        downloadingRef={downloadingRef}
                    />
                )}
            </div>

        </div>
    );
};

export default ReportsPage;