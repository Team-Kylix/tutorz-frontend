import React, { useState, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import { MOCK_SUBJECTS } from '../../utils/mockData';
import { getJoinedInstitutes, getInstituteHalls } from '../../services/api/tutorService';

const ClassFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  onStatusChange,
  initialData = null,
  isSubmitting
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
    fee: '',
    isActive: true
  });

  const [institutes, setInstitutes] = useState([]);
  const [halls, setHalls] = useState([]);
  const [isLoadingInstitutes, setIsLoadingInstitutes] = useState(false);
  const [isLoadingHalls, setIsLoadingHalls] = useState(false);

  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);

  // Fetch Institutes
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, initialData]);

  // Fetch Halls when instituteId changes
  useEffect(() => {
    if (!isOpen || !formData.instituteId) {
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
        if (fetchedHalls.length > 0 && !initialData?.hallId) {
          setFormData(prev => ({ ...prev, hallId: fetchedHalls[0].hallId, hallName: fetchedHalls[0].name }));
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
  }, [formData.instituteId, isOpen, initialData]);

  // Sync form data on open/edit
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFormData({
        ...initialData,
        dayOfWeek: initialData.dayOfWeek || 'Monday',
        date: initialData.date ? initialData.date.split('T')[0] : '',
        isActive: initialData.isActive ?? true
      });
    } else {
      setFormData(prev => ({
        ...prev,
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
        fee: '',
        isActive: true
      }));
    }
  }, [initialData, isOpen]);

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

  const toggleStatus = () => {
    if (initialData) onStatusChange(formData);
    else setFormData((prev) => ({ ...prev, isActive: !prev.isActive }));
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
            {initialData ? 'Edit Details' : 'Create New Session'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="text-gray-500 dark:text-gray-400" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">

          {/* 1. Institute & Type */}
          <div className="flex flex-col gap-1">
            <label className={labelClass}>
              Institute <span className="text-red-500">*</span>
            </label>
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
          </div>

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

          {/* 4. Hall & Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>
                Hall <span className="text-red-500">*</span>
              </label>
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

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-4 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive
                        ? 'translate-x-6'
                        : 'translate-x-1'
                        }`}
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
                    // Date comparison logic can be tricky, check if one changed
                    // For simplicity, checking if payload data matches initial.
                    (initialData.date ? initialData.date.split('T')[0] : '') === formData.date &&
                    (initialData.dayOfWeek || 'Monday') === formData.dayOfWeek &&
                    initialData.startTime === formData.startTime &&
                    initialData.endTime === formData.endTime &&
                    initialData.hallName === formData.hallName &&
                    initialData.fee == formData.fee &&
                    (initialData.isActive ?? true) === formData.isActive
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
                    (initialData.isActive ?? true) === formData.isActive
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassFormModal;