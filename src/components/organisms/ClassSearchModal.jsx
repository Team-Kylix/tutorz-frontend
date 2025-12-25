import React, { useState, useEffect } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { searchClasses, requestJoinClass } from '../../services/api/studentService'; 
import ClassCard from '../molecules/ClassCard';
import ClassDetailView from '../molecules/ClassDetailView';

const ClassSearchModal = ({ isOpen, onClose, userGrade }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch Data when Modal Opens or Search/Grade changes
  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
        setSelectedClass(null);
        setAvailableClasses([]);
        return;
    }

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError('');
            // Call Backend
            const data = await searchClasses(userGrade, searchTerm);
            setAvailableClasses(data);
        } catch (err) {
            console.error("Search failed", err);
            setError('Failed to load classes.');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search to prevent too many API calls while typing
    const delayDebounceFn = setTimeout(() => {
        fetchClasses();
    }, 500);

    return () => clearTimeout(delayDebounceFn);

  }, [searchTerm, isOpen, userGrade]);

  const handleRequestJoin = async (classId) => {
    try {
        await requestJoinClass(classId);
        alert("Request to join sent successfully! Please wait for tutor approval.");
        onClose();
    } catch (err) {
        alert(err.message || "Failed to send request.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
                {selectedClass ? 'Class Details' : 'Find a New Class'}
            </h2>
            {!selectedClass && (
                <p className="text-sm text-gray-500">Showing classes for <span className="font-bold text-blue-600">{userGrade}</span></p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
          
          {selectedClass ? (
            <ClassDetailView 
                classData={selectedClass} 
                onBack={() => setSelectedClass(null)}
                onRequestJoin={handleRequestJoin}
            />
          ) : (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={20} />
                </span>
                <input
                  type="text"
                  placeholder="Search by Subject, Tutor Name or Tutor ID (TUT)..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Error State */}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              {/* Loading State */}
              {loading && (
                  <div className="flex justify-center py-12">
                      <Loader className="animate-spin text-blue-600" size={32} />
                  </div>
              )}

              {/* Results Grid */}
              {!loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableClasses.length > 0 ? (
                      availableClasses.map((cls) => (
                        <div 
                            key={cls.id} 
                            onClick={() => setSelectedClass(cls)}
                            className="cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                        >
                          <ClassCard
                            subject={cls.subject}
                            grade={cls.grade}
                            className={cls.tutorName} 
                            time={`${cls.dayOfWeek} ${cls.startTime}`}
                            students={0}
                            status={cls.status}
                            fee={cls.fee}
                            classType={cls.classType}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 text-gray-500">
                        <Search size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No classes found.</p>
                        <p className="text-sm">Try adjusting your search terms.</p>
                      </div>
                    )}
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassSearchModal;