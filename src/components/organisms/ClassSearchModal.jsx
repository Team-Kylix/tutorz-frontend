import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Modal from '../molecules/Modal';
import ClassCard from '../molecules/ClassCard';
import ClassDetailView from '../molecules/ClassDetailView';

// --- MOCK DATA FOR AVAILABLE CLASSES ---
const MOCK_AVAILABLE_CLASSES = [
  {
    id: 101,
    subject: 'Science Revision',
    grade: 'Grade 8',
    tutorName: 'Dr. Sarah Perera',
    tutorId: 'TUT-001',
    bio: 'PhD in Biology with 10 years of teaching experience. Expert in Science for middle school.',
    fee: '2500',
    dayOfWeek: 'Saturday',
    startTime: '08:00 AM',
    endTime: '10:00 AM',
    classType: 'Class',
    status: 'Active'
  },
  {
    id: 102,
    subject: 'Mathematics',
    grade: 'Grade 8',
    tutorName: 'Mr. Amal Silva',
    tutorId: 'TUT-005',
    bio: 'Engineering graduate making Math easy for everyone. Specialized in Geometry and Algebra.',
    fee: '2000',
    dayOfWeek: 'Sunday',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
    classType: 'Class',
    status: 'Active'
  },
  {
    id: 103,
    subject: 'English Literature',
    grade: 'Grade 8',
    tutorName: 'Ms. Kanthi Dias',
    tutorId: 'TUT-012',
    bio: 'English teacher at a leading international school.',
    fee: '1800',
    dayOfWeek: 'Wednesday',
    startTime: '04:00 PM',
    endTime: '06:00 PM',
    classType: 'Class',
    status: 'Starting Soon'
  },
  {
    id: 104,
    subject: 'Science Paper Class',
    grade: 'Grade 9',
    tutorName: 'Dr. Sarah Perera',
    tutorId: 'TUT-001',
    bio: 'Targeting term tests.',
    fee: '3000',
    dayOfWeek: 'Friday',
    startTime: '05:00 PM',
    endTime: '07:00 PM',
    classType: 'Seminar',
    status: 'Active'
  }
];

const ClassSearchModal = ({ isOpen, onClose, userGrade }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [filteredClasses, setFilteredClasses] = useState([]);

  // Filter logic
  useEffect(() => {
    if (!isOpen) {
        // Reset state when modal closes
        setSearchTerm('');
        setSelectedClass(null);
        return;
    }

    // 1. Filter by Grade (Match user grade)
    // 2. Filter by Search Query (Subject, Tutor Name, TUT ID)
    const results = MOCK_AVAILABLE_CLASSES.filter(cls => {
      const matchesGrade = userGrade ? cls.grade === userGrade : true; // Show all if userGrade undefined
      
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        cls.subject.toLowerCase().includes(query) ||
        cls.tutorName.toLowerCase().includes(query) ||
        cls.tutorId.toLowerCase().includes(query);

      return matchesGrade && matchesSearch;
    });

    setFilteredClasses(results);
  }, [searchTerm, isOpen, userGrade]);

  const handleRequestJoin = (classId) => {
    // API Call logic would go here
    alert(`Request sent to join class ID: ${classId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    // We use a custom wrapper instead of the standard Modal molecule 
    // to have full control over the width and layout for this specific flow
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
          
          {/* VIEW 1: CLASS DETAIL */}
          {selectedClass ? (
            <ClassDetailView 
                classData={selectedClass} 
                onBack={() => setSelectedClass(null)}
                onRequestJoin={handleRequestJoin}
            />
          ) : (
            
            /* VIEW 2: SEARCH & LIST */
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

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <div 
                        key={cls.id} 
                        onClick={() => setSelectedClass(cls)}
                        className="cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                    >
                      <ClassCard
                        subject={cls.subject}
                        grade={cls.grade}
                        className={cls.tutorName} // Displaying Tutor Name in the large text area of ClassCard
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassSearchModal;