import React, { useState, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import { MOCK_SUBJECTS } from '../../utils/mockData';
import { getJoinedInstitutes, getInstituteHalls } from '../../services/api/tutorService';
import { getAssignedTutors } from '../../services/api/instituteService';

const ClassFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  onStatusChange,
  initialData = null,
  isSubmitting,
  isInstituteMode = false,
  instituteProfile = null,
  existingClasses = [],   // ← all classes already in this institute
  backendError = '',      // ← error message from backend (e.g. hall conflict)
  viewOnly = false,       // ← read-only timetable view — no edit/delete
}) => {

  const [formData, setFormData] = useState({
    instituteName: '',
    classType: 'Class',
    subject: '',
    grade: '',
    className: '',
    date: '',
    dayOfWeek: 'Monday',
    startTime: '',
    endTime: '',
    hallName: '',
    hallId: '',
    instituteId: '',
    tutorId: '', // Added for Institute mode
    tutorName: '', // Added for Institute mode
    fee: '',
    isActive: true
  });

  const [timeError, setTimeError] = useState('');

  const [institutes, setInstitutes] = useState([]);
  const [halls, setHalls] = useState([]);
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(false);
  const [isLoadingHalls, setIsLoadingHalls] = useState(false);

  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);

  // Tutor Search State
  const [tutorQuery, setTutorQuery] = useState('');
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [showTutorSuggestions, setShowTutorSuggestions] = useState(false);
  const [isSearchingTutors, setIsSearchingTutors] = useState(false);

  // Fetch Institutes (Only for Tutors)
  useEffect(() => {
    if (!isOpen || isInstituteMode || viewOnly) return;

    const fetchInstitutes = async () => {
      setIsLoadingInstitutes(true);
      try {
        const res = await getJoinedInstitutes();
        // Assuming API returns array of institutes directly or in res.data
        const fetchedInstitutes = Array.isArray(res) ? res : (res?.data || []);
        setInstitutes(fetchedInstitutes);

        // If initial data has instituteName but no instituteId, find it
        if (initialData && !initialData.instituteId && initialData.instituteName) {
          const found = fetchedInstitutes.find(i => i.name === initialData.instituteName);
          if (found) {
            setFormData(prev => ({ ...prev, instituteId: found.instituteId || found.id }));
          }
        }
        // If create mode and institutes available, select first by default
        else if (!initialData && fetchedInstitutes.length > 0) {
          setFormData(prev => ({
            ...prev,
            instituteId: 'OWN_PLACE',
            instituteName: 'My Own Place'
          }));
        }
      } catch (error) {
        console.error("Failed to load institutes:", error);
      } finally {
        setIsLoadingInstitutes(false);
      }
    };
    fetchInstitutes();
  }, [isOpen, initialData, isInstituteMode, instituteProfile]);

  // Fetch Halls when instituteId changes
  useEffect(() => {
    if (!isOpen || !formData.instituteId || viewOnly) {
      setHalls([]);
      return;
    }
    const fetchHalls = async () => {
      setIsLoadingHalls(true);
      try {
        const res = await getInstituteHalls(formData.instituteId);
        const fetchedHalls = Array.isArray(res) ? res : (res?.data || []);
        setHalls(fetchedHalls);

        // Reset hall if the current hall is not in the new list, or auto-select if only one
        if (fetchedHalls.length > 0) {
          let selectedHallId = null;
          let selectedHallName = '';

          if (initialData?.hallId) {
            // Already explicitly defined
            selectedHallId = initialData.hallId;
          } else if (initialData?.hallName) {
            // Missing ID, try to match by name
            const match = fetchedHalls.find(h => h.name.toLowerCase() === initialData.hallName.toLowerCase());
            if (match) {
              selectedHallId = match.hallId || match.id;
              selectedHallName = match.name;
            }
          }

          if (selectedHallId) {
            setFormData(prev => ({ ...prev, hallId: selectedHallId, hallName: selectedHallName || prev.hallName }));
          } else {
            // Default to first if no match
            const firstId = fetchedHalls[0].hallId || fetchedHalls[0].id;
            setFormData(prev => ({ ...prev, hallId: firstId, hallName: fetchedHalls[0].name }));
          }
        } else if (fetchedHalls.length === 0) {
          setFormData(prev => ({ ...prev, hallId: '', hallName: '' }));
        }
      } catch (error) {
        console.error("Failed to load halls:", error);
        setHalls([]);
      } finally {
        setIsLoadingHalls(false);
      }
    };
    fetchHalls();
  }, [formData.instituteId, isOpen, initialData, isInstituteMode]);

  // Handle Tutor Search (Debounced)
  useEffect(() => {
    if (!isInstituteMode || !tutorQuery.trim() || formData.tutorName === tutorQuery) {
      setFilteredTutors([]);
      setIsSearchingTutors(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingTutors(true);
      try {
        // Using getAssignedTutors for the search mapping
        const res = await getAssignedTutors(tutorQuery, 1, 5);
        setFilteredTutors(res.data?.items || res.items || []);
        setShowTutorSuggestions(true);
      } catch (error) {
        console.error("Failed to search tutors:", error);
        setFilteredTutors([]);
      } finally {
        setIsSearchingTutors(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tutorQuery, isInstituteMode, formData.tutorName]);

  // Sync form data on open/edit
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      let newFormData = {
        ...initialData,
        grade: initialData.grade || '', // Ensure grade gets mapped explicitly
        tutorId: initialData.tutorId || '', // Ensure tutorId gets mapped
        dayOfWeek: initialData.dayOfWeek || 'Monday',
        date: initialData.date ? initialData.date.split('T')[0] : '',
        isActive: initialData.isActive ?? true
      };

      if (isInstituteMode && instituteProfile) {
        newFormData.instituteId = initialData.instituteId || instituteProfile.instituteId || instituteProfile.id;
        newFormData.instituteName = initialData.instituteName || instituteProfile.instituteName || instituteProfile.name;
      }
      setFormData(newFormData);

      // If editing in institute mode, initialize the search box with the tutor's name
      if (isInstituteMode && initialData.tutorName) {
        setTutorQuery(initialData.tutorName);
      } else {
        setTutorQuery('');
      }
    } else {
      let newFormData = {
        classType: 'Class',
        subject: '',
        grade: '',
        className: '',
        date: '',
        dayOfWeek: 'Monday',
        startTime: '',
        endTime: '',
        hallName: '',
        hallId: '',
        tutorId: '',
        tutorName: '',
        fee: '',
        isActive: true
      };

      if (isInstituteMode && instituteProfile) {
        newFormData.instituteId = instituteProfile.instituteId || instituteProfile.id;
        newFormData.instituteName = instituteProfile.instituteName || instituteProfile.name;
      }
      setFormData(newFormData);
      setTutorQuery('');
    }
  }, [initialData, isOpen, isInstituteMode, instituteProfile]);

  // Auto-generate Class Name
  useEffect(() => {
    if (formData.subject && formData.grade) {
      let suffix = '';
      if (['Class', 'Course'].includes(formData.classType) && formData.dayOfWeek) {
        suffix = formData.dayOfWeek;
      } else if (formData.date) {
        const dateObj = new Date(formData.date);
        suffix = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
      }

      const generatedName = `${formData.classType} - ${formData.subject} - ${formData.grade}` + (suffix ? ` - ${suffix}` : '');
      setFormData(prev => ({ ...prev, className: generatedName }));
    }
  }, [formData.subject, formData.grade, formData.dayOfWeek, formData.date, formData.classType]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked, options, selectedIndex } = e.target;

    setFormData((prev) => {
      const updates = { [name]: type === 'checkbox' ? checked : value };

      // If changing institute, also capture the text name
      if (name === 'instituteId') {
        if (value === 'OWN_PLACE') {
          updates.instituteName = 'My Own Place';
          updates.hallId = null;
          updates.hallName = 'N/A';
        } else {
          updates.instituteName = options[selectedIndex].text;
        }
      }
      // If changing hall, also capture the text name
      if (name === 'hallId') {
        updates.hallName = options[selectedIndex].text;
      }

      return { ...prev, ...updates };
    });

    if (name === 'startTime' || name === 'endTime') {
      setTimeError(''); // Clear error when user changes time
    }

    if (name === 'subject') {
      if (value.length > 0) {
        setFilteredSubjects(
          MOCK_SUBJECTS.filter((s) =>
            s.toLowerCase().includes(value.toLowerCase())
          )
        );
        setShowSubjectSuggestions(true);
      } else {
        setShowSubjectSuggestions(false);
      }
    }
  };

  const handleSubjectSelect = (subj) => {
    setFormData((prev) => ({ ...prev, subject: subj }));
    setShowSubjectSuggestions(false);
  };

  const handleTutorSelect = (tutor) => {
    const fullName = `${tutor.firstName} ${tutor.lastName}`;
    setFormData((prev) => ({
      ...prev,
      tutorId: tutor.tutorId,
      tutorName: fullName
    }));
    setTutorQuery(fullName);
    setShowTutorSuggestions(false);
  };

  const toggleStatus = () => {
    if (initialData) onStatusChange(formData);
    else setFormData((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  // ─── Hall Conflict Checker ───────────────────────────────────────────────
  const checkHallConflict = () => {
    // Only check if a real hall name is set and time is complete
    if (!formData.hallName || formData.hallName === 'N/A' || !formData.startTime || !formData.endTime) {
      return null;
    }

    const toMinutes = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(formData.startTime);
    const newEnd = toMinutes(formData.endTime);
    const newHallName = formData.hallName.toLowerCase().trim();

    // Determine the schedule key for matching (dayOfWeek for recurring, date for one-off)
    const isRecurringNew = ['Class', 'Course'].includes(formData.classType);
    const newDayKey = isRecurringNew ? formData.dayOfWeek?.toLowerCase() : null;
    const newDateKey = !isRecurringNew ? formData.date : null;

    for (const cls of existingClasses) {
      // Skip the class being edited
      if (initialData && cls.classId === initialData.classId) continue;

      // Skip inactive classes — they don't hold the time slot
      if (cls.isActive === false) continue;

      // Must be the same hall (compare by name, case-insensitive)
      const clsHallName = (cls.hallName || '').toLowerCase().trim();
      if (!clsHallName || clsHallName !== newHallName) continue;

      // Check day/date match
      const existingDayKey = cls.dayOfWeek?.toLowerCase() ?? null;
      const existingDateKey = cls.date ? cls.date.split('T')[0] : null;

      let dayMatch = false;
      if (newDayKey && existingDayKey) {
        dayMatch = newDayKey === existingDayKey;
      } else if (newDateKey && existingDateKey) {
        dayMatch = newDateKey === existingDateKey;
      } else if (newDayKey && existingDateKey) {
        const existingDayName = new Date(existingDateKey).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
        dayMatch = newDayKey === existingDayName;
      } else if (newDateKey && existingDayKey) {
        const newDayName = new Date(newDateKey).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase();
        dayMatch = newDayName === existingDayKey;
      }

      if (!dayMatch) continue;

      // Check time overlap
      if (!cls.startTime || !cls.endTime) continue;
      const exStart = toMinutes(cls.startTime);
      const exEnd = toMinutes(cls.endTime);

      if (newStart < exEnd && newEnd > exStart) {
        const tutorLabel = cls.tutorName || 'Another tutor';
        const hallLabel = formData.hallName || 'this hall';
        return `Cannot create class — ${tutorLabel}'s class already occupies ${hallLabel} from ${cls.startTime} to ${cls.endTime} on this day.`;
      }
    }
    return null;
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    if (!MOCK_SUBJECTS.includes(formData.subject)) {
      alert('Please select a valid subject.');
      return;
    }

    if (!formData.className.trim()) {
      alert('Class Name is required.');
      return;
    }

    if (isInstituteMode && !formData.tutorId) {
      alert('Please select an assigned tutor.');
      return;
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      setTimeError('End Time must be later than Start Time.');
      return;
    }

    // ── Hall conflict check ──────────────────────────────────────────────────
    const conflictMessage = checkHallConflict();
    if (conflictMessage) {
      setTimeError(conflictMessage);
      return;
    }

    let finalDayString = null;
    let finalDate = null;

    if (['Class', 'Course'].includes(formData.classType)) {
      finalDayString = formData.dayOfWeek;
    } else if (formData.date) {
      finalDate = formData.date;
      const dateObj = new Date(formData.date);
      finalDayString = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC'
      });
    }

    const payload = {
      ...formData,
      instituteId: formData.instituteId === 'OWN_PLACE' ? null : formData.instituteId,
      tutorId: formData.tutorId === '' ? null : formData.tutorId,
      hallId: formData.hallId === '' ? null : formData.hallId,
      fee: parseFloat(formData.fee),
      dayOfWeek: finalDayString,
      date: finalDate
    };

    onSubmit(payload);
  };

  const isRecurring = ['Class', 'Course'].includes(formData.classType);

  if (!isOpen) return null;

  // Reusable styling
  const inputClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none transition-colors";
  const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";
  const readOnlyBoxClass = "w-full px-3 py-2 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium select-none cursor-default";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {viewOnly ? 'Class Details' : initialData ? 'Edit Details' : 'Create New Session'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="text-gray-500 dark:text-gray-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          <fieldset disabled={viewOnly} className="contents">

            {/* 1. Institute & Type */}
            <div className="flex flex-col gap-1">
              <label className={labelClass}>
                Institute <span className="text-red-500">*</span>
              </label>
              {viewOnly || isInstituteMode ? (
                <div className={readOnlyBoxClass}>
                  {formData.instituteName || 'Not Applicable'}
                </div>
              ) : (
                <select
                  name="instituteId"
                  value={formData.instituteId || ''}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={isLoadingInstitutes}
                >
                  <option value="OWN_PLACE">My Own Place</option>
                  {isLoadingInstitutes ? (
                    <option value="" disabled>Loading...</option>
                  ) : (
                    institutes.map((inst) => (
                      <option key={inst.instituteId || inst.id} value={inst.instituteId || inst.id}>
                        {inst.name} {inst.city ? `- ${inst.city}` : ''}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {(isInstituteMode || viewOnly) && (
              <div className="relative flex flex-col gap-1">
                <label className={labelClass}>
                  Assigned Tutor <span className="text-red-500">*</span>
                </label>
                {viewOnly ? (
                  <div className={readOnlyBoxClass}>
                    {formData.tutorName || 'Not Assigned'}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputClass} pl-10`}
                      placeholder="Search tutor by name..."
                      value={tutorQuery}
                      onChange={(e) => {
                        setTutorQuery(e.target.value);
                        if (formData.tutorId) {
                          setFormData(prev => ({ ...prev, tutorId: '', tutorName: '' })); // Reset if typing
                        }
                      }}
                      onFocus={() => {
                        if (tutorQuery.trim() && filteredTutors.length > 0) setShowTutorSuggestions(true);
                      }}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Search size={16} />
                    </div>

                    {showTutorSuggestions && (
                      <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1 top-full">
                        {isSearchingTutors && filteredTutors.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-gray-500 text-center">Searching...</li>
                        ) : filteredTutors.length > 0 ? (
                          filteredTutors.map((tutor) => (
                            <li
                              key={tutor.tutorId}
                              onMouseDown={() => handleTutorSelect(tutor)}
                              className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 transition-colors flex justify-between items-center"
                            >
                              <span>{tutor.firstName} {tutor.lastName}</span>
                              <span className="text-xs text-gray-400">{tutor.registrationNumber}</span>
                            </li>
                          ))
                        ) : (
                          <li className="px-4 py-3 text-sm text-gray-500 text-center">No assigned tutors found</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={labelClass}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="classType"
                value={formData.classType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Class">Class (Weekly)</option>
                <option value="Seminar">Seminar</option>
                <option value="Workshop">Workshop</option>
                <option value="Course">Course</option>
              </select>
            </div>

            {/* 2. Grade & Subject */}
            {isRecurring ? (
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className={inputClass}
                  required
                >
                  <option value="">Select Grade</option>
                  {[
                    'Preschool', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4',
                    'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
                    'Grade 10', 'Grade 11 (O/L)', 'Grade 12 (A/L)', 'Grade 13 (A/L)'
                  ].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <FormField
                id="grade"
                label="Audience"
                placeholder="e.g. O/L Students"
                value={formData.grade}
                onChange={handleChange}
              />
            )}

            <div className="relative flex flex-col justify-end">
              <div className="relative">
                <FormField
                  id="subject"
                  label="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Search subject..."
                  autoComplete="off"
                  required
                />
                <div className="absolute right-3 top-9 text-gray-400 pointer-events-none">
                  <Search size={16} />
                </div>
              </div>

              {showSubjectSuggestions && filteredSubjects.length > 0 && (
                <ul className="absolute z-20 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1">
                  {filteredSubjects.map((s) => (
                    <li
                      key={s}
                      onMouseDown={() => handleSubjectSelect(s)}
                      className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. Day / Date & Time */}
            <div className="flex flex-col gap-1">
              <label className={labelClass}>
                {isRecurring ? 'Day' : 'Date'}{' '}
                <span className="text-red-500">*</span>
              </label>

              {isRecurring ? (
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {[
                    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                    'Friday', 'Saturday', 'Sunday'
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {(timeError || backendError) && (
              <div className="text-sm text-red-500 mt-1 mb-2 font-medium">
                {timeError || backendError}
              </div>
            )}

            {/* 4. Hall & Fee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>
                  Hall <span className="text-red-500">*</span>
                </label>
                {viewOnly ? (
                  <div className={readOnlyBoxClass}>
                    {formData.hallName || 'Not Applicable'}
                  </div>
                ) : (
                  <select
                    name="hallId"
                    value={formData.hallId || ''}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={isLoadingHalls || !formData.instituteId || formData.instituteId === 'OWN_PLACE'}
                    required={formData.instituteId !== 'OWN_PLACE'}
                  >
                    <option value="">Select Hall</option>
                    {formData.instituteId === 'OWN_PLACE' ? (
                      <option value="" disabled>Not Applicable</option>
                    ) : isLoadingHalls ? (
                      <option value="" disabled>Loading halls...</option>
                    ) : halls.length === 0 ? (
                      <option value="" disabled>No halls available</option>
                    ) : (
                      halls.map((hall) => (
                        <option key={hall.hallId || hall.id} value={hall.hallId || hall.id}>
                          {hall.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              <FormField
                id="fee"
                label="Fee (LKR)"
                type="number"
                value={formData.fee}
                onChange={handleChange}
                required
              />
            </div>

            {/* 5. Auto-generated Name (Read Only) */}
            <div className="flex flex-col gap-1 pt-2">
              <label className={labelClass}>
                {isRecurring ? 'Auto-generated Name' : 'Auto-generated Title'}
              </label>
              <div className={readOnlyBoxClass}>
                {formData.className || <span className="text-gray-400 font-normal italic">Select Subject, Grade & Day</span>}
              </div>
            </div>

          </fieldset>{/* end disabled fieldset — buttons below are outside it */}

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-4 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">

            {/* ── View-Only mode: just a Close button ── */}
            {viewOnly ? (
              <div className="w-full flex justify-end">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="order-3 sm:order-1 w-full sm:w-auto flex justify-center sm:justify-start">
                  {initialData && (
                    <button
                      type="button"
                      onClick={() => onDelete(initialData.classId)}
                      className="flex items-center gap-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>

                <div className="order-2 sm:order-2 w-full sm:w-auto flex justify-center py-2 sm:py-0">
                  {initialData && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={toggleStatus}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <span className="text-xs font-semibold w-14 inline-block">
                        {formData.isActive ? (
                          <span className="text-green-600 dark:text-green-400">Active</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Inactive</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="order-1 sm:order-3 w-full sm:w-auto flex gap-3">
                  <Button variant="secondary" onClick={onClose} fullWidth>
                    Cancel
                  </Button>

                  {initialData ? (
                    <button
                      type="submit"
                      disabled={isSubmitting || (
                        initialData.instituteName === formData.instituteName &&
                        initialData.classType === formData.classType &&
                        initialData.subject === formData.subject &&
                        initialData.grade === formData.grade &&
                        initialData.className === formData.className &&
                        (initialData.date ? initialData.date.split('T')[0] : '') === formData.date &&
                        (initialData.dayOfWeek || 'Monday') === formData.dayOfWeek &&
                        initialData.startTime === formData.startTime &&
                        initialData.endTime === formData.endTime &&
                        initialData.hallName === formData.hallName &&
                        initialData.fee == formData.fee &&
                        (initialData.isActive ?? true) === formData.isActive &&
                        (!isInstituteMode || initialData.tutorId === formData.tutorId)
                      )}
                      className={`w-full sm:w-auto px-6 py-2 rounded-lg text-sm font-medium transition-colors ${isSubmitting || (
                        initialData.instituteName === formData.instituteName &&
                        initialData.classType === formData.classType &&
                        initialData.subject === formData.subject &&
                        initialData.grade === formData.grade &&
                        initialData.className === formData.className &&
                        (initialData.date ? initialData.date.split('T')[0] : '') === formData.date &&
                        (initialData.dayOfWeek || 'Monday') === formData.dayOfWeek &&
                        initialData.startTime === formData.startTime &&
                        initialData.endTime === formData.endTime &&
                        initialData.hallName === formData.hallName &&
                        initialData.fee == formData.fee &&
                        (initialData.isActive ?? true) === formData.isActive &&
                        (!isInstituteMode || initialData.tutorId === formData.tutorId)
                      )
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 dark:shadow-none'
                        }`}
                    >
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} fullWidth variant="primary">
                      {isSubmitting ? 'Saving...' : 'Create'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassFormModal;