import React, { useState, useEffect } from 'react';
import { X, Trash2, Search } from 'lucide-react';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import { MOCK_INSTITUTES, MOCK_SUBJECTS } from '../../utils/mockData';

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
    fee: '',
    isActive: true
  });

  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);

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
      setFormData({
        instituteName: MOCK_INSTITUTES[0]?.name || '',
        classType: 'Class',
        subject: '',
        grade: '',
        className: '',
        date: '',
        dayOfWeek: 'Monday',
        startTime: '',
        endTime: '',
        hallName: '',
        fee: '',
        isActive: true
      });
    }
  }, [initialData, isOpen]);

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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

  // Reusable input class for raw selects/inputs to ensure consistency
  const inputClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none transition-colors";
  const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-300";

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

          {/* Institute & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>
                Institute <span className="text-red-500">*</span>
              </label>
              <select
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                className={inputClass}
              >
                {MOCK_INSTITUTES.map((inst) => (
                  <option key={inst.id} value={inst.name}>
                    {inst.name}
                  </option>
                ))}
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
          </div>

          {/* Grade & Name */}
          <div className="grid grid-cols-2 gap-4">
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

            <FormField
              id="className"
              label={isRecurring ? 'Name' : 'Title'}
              placeholder="e.g. Revision"
              value={formData.className}
              onChange={handleChange}
              required
            />
          </div>

          {/* Subject */}
          <div className="relative">
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

          {/* Day / Date & Time */}
          <div className="grid grid-cols-3 gap-4">
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

            <FormField
              id="startTime"
              label="Start"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
            <FormField
              id="endTime"
              label="End"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          {/* Hall & Fee */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="hallName"
              label="Hall Name"
              value={formData.hallName}
              onChange={handleChange}
              required
            />
            <FormField
              id="fee"
              label="Fee (LKR)"
              type="number"
              value={formData.fee}
              onChange={handleChange}
              required
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="order-3 sm:order-1 w-full sm:w-auto flex justify-center sm:justify-start">
              {initialData && (
                <button
                  type="button"
                  onClick={() => onDelete(initialData.classId)}
                  className="flex items-center gap-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>

            <div className="order-2 sm:order-2 w-full sm:w-auto flex justify-center">
              {initialData && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleStatus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive
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
              <Button type="submit" disabled={isSubmitting} fullWidth>
                {isSubmitting
                  ? 'Saving...'
                  : initialData
                  ? 'Update'
                  : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassFormModal;