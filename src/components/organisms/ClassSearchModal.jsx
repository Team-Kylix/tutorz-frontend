import React, { useState, useEffect } from 'react';
import { Search, X, Loader, Filter, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { searchClasses, requestJoinClass } from '../../services/api/studentService'; 
import { searchLocations } from '../../services/api/locationService';
import ClassCard from '../molecules/ClassCard';
import ClassDetailView from '../molecules/ClassDetailView';
import ConfirmationModal from '../molecules/ConfirmationModal';
import { GRADE_GROUPS } from '../../utils/constants';
import SelectField from '../molecules/SelectField';
import { formatTime } from '../../utils/helpers';

const ClassSearchModal = ({ isOpen, onClose, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [selectedGrade, setSelectedGrade] = useState(user?.grade || '');

  // Locations Hierarchical Search
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [selectedLocationName, setSelectedLocationName] = useState('');

  // Confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingClassId, setPendingClassId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  // Handle Grade Change
  const handleGradeChange = (e) => {
    setSelectedGrade(e.target.value);
  };


  // Update filters when modal opens or user data changes
  useEffect(() => {
    if (isOpen && user) {
      // Use camelCase first, fallback to PascalCase if from raw API
      let profileGrade = user.grade || user.Grade;
      const profileProvinceId = user.provinceId || user.ProvinceId;
      const profileProvinceName = user.provinceName || user.ProvinceName;

      // Robust check for Grade normalization (e.g., if it's "6", convert to "Grade 6")
      if (profileGrade && typeof profileGrade === 'string' && !profileGrade.startsWith('Grade') && !isNaN(profileGrade)) {
          profileGrade = `Grade ${profileGrade}`;
      } else if (profileGrade && typeof profileGrade === 'number') {
          profileGrade = `Grade ${profileGrade}`;
      }

      if (profileGrade) setSelectedGrade(profileGrade);
      if (profileProvinceId) {
          setSelectedProvinceId(profileProvinceId);
          setSelectedLocationName(profileProvinceName ? `${profileProvinceName} Province` : 'Your Province');
      }
    }
  }, [isOpen, user]);

  // Fetch Data when Search/Grade/District changes
  const fetchClasses = React.useCallback(async (isLoadMore = false, currentPage = 1) => {
    if (!isLoadMore) {
        setLoading(true);
    } else {
        setIsLoadingMore(true);
    }
    setError('');

    try {
        const data = await searchClasses(selectedGrade, searchTerm, selectedProvinceId, selectedDistrictId, selectedCityId, currentPage, PAGE_SIZE);
        const newClasses = data.items || [];
        
        if (isLoadMore) {
            setAvailableClasses(prev => [...prev, ...newClasses]);
        } else {
            setAvailableClasses(newClasses);
        }
        
        setHasMore(data.hasNextPage || false);
    } catch (err) {
        console.error("Search failed", err);
        setError('Failed to load classes.');
    } finally {
        setLoading(false);
        setIsLoadingMore(false);
    }
  }, [selectedGrade, searchTerm, selectedProvinceId, selectedDistrictId, selectedCityId, PAGE_SIZE]);

  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
        setSelectedClass(null);
        setAvailableClasses([]);
        setPage(1);
        setHasMore(true);
        return;
    }

    // Reset pagination and fetch fresh results when filters change
    setPage(1);
    const delayDebounceFn = setTimeout(() => {
        fetchClasses(false, 1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isOpen, selectedGrade, selectedProvinceId, selectedDistrictId, selectedCityId, fetchClasses]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoadingMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchClasses(true, nextPage);
    }
  };

  // Fetch Locations as user types
  useEffect(() => {
    if (!locationQuery || locationQuery.length < 2) {
      setLocationResults([]);
      return;
    }

    const fetchLocations = async () => {
      try {
        const data = await searchLocations(locationQuery);
        setLocationResults(data);
      } catch (err) {
        console.error("Location search failed", err);
      }
    };

    const debounceTimer = setTimeout(fetchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [locationQuery]);

  const handleLocationSelect = (type, id, name) => {
    if (type === 'city') {
      setSelectedCityId(id);
      setSelectedDistrictId(null);
      setSelectedProvinceId(null);
      setSelectedLocationName(name);
    } else if (type === 'district') {
      setSelectedCityId(null);
      setSelectedDistrictId(id);
      setSelectedProvinceId(null);
      setSelectedLocationName(name);
    } else if (type === 'province') {
      setSelectedCityId(null);
      setSelectedDistrictId(null);
      setSelectedProvinceId(id);
      setSelectedLocationName(`${name} Province`);
    }
    setLocationQuery('');
    setLocationResults([]);
    setShowLocationDropdown(false);
  };

  // Handle clicking outside location dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.location-search-container')) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initiateJoinRequest = (classId) => {
    setPendingClassId(classId);
    setShowConfirmModal(true);
  };

  const confirmJoinRequest = async () => {
    if (!pendingClassId) return;
    
    try {
        setIsSubmitting(true);
        await requestJoinClass(pendingClassId);
        
        // Update local state immediately
        setAvailableClasses(prev => prev.map(cls => 
            (cls.id === pendingClassId || cls.classId === pendingClassId) 
            ? { ...cls, enrollmentStatus: 'Pending' } 
            : cls
        ));

        // If a class is currently selected in detail view, update it too
        if (selectedClass && (selectedClass.id === pendingClassId || selectedClass.classId === pendingClassId)) {
            setSelectedClass(prev => ({ ...prev, enrollmentStatus: 'Pending' }));
        }

        setShowConfirmModal(false);
        setPendingClassId(null);
    } catch (err) {
        alert(err.message || "Failed to send request.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            {selectedClass && (
              <button
                onClick={() => setSelectedClass(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Back to Search"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedClass ? 'Class Details' : 'Find a New Class'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content Body */}
        <div 
          className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800 custom-scrollbar"
          onScroll={handleScroll}
        >
          
          {selectedClass ? (
            <ClassDetailView 
                classData={selectedClass} 
                role="student"
                enrollmentStatus={selectedClass?.enrollmentStatus}
                onRequestJoin={initiateJoinRequest}
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Filters Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grade Selection */}
                <SelectField
                    id="grade"
                    label="Grade / Course"
                    value={selectedGrade}
                    onChange={handleGradeChange}
                    groups={GRADE_GROUPS}
                    placeholder="All Grades"
                />

                {/* Location Selection */}
                <div className="relative location-search-container">
                   <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location (Town or District)
                      </label>
                      {selectedLocationName && (
                        <button 
                          onClick={() => {
                            setSelectedCityId(null);
                            setSelectedDistrictId(null);
                            setSelectedProvinceId(null);
                            setSelectedLocationName('');
                          }}
                          className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider mb-1 px-1"
                        >
                          Clear
                        </button>
                      )}
                   </div>
                   
                   <div className="relative">
                      <input
                        type="text"
                        placeholder={selectedLocationName ? `Selected: ${selectedLocationName}` : "Search Town or District..."}
                        className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-500 dark:focus:border-blue-500 ${selectedLocationName ? 'ring-2 ring-blue-500/20 border-blue-500 placeholder-blue-600 dark:placeholder-blue-400' : 'border-gray-200 dark:border-gray-700'}`}
                        value={locationQuery}
                        onChange={(e) => {
                          setLocationQuery(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                      />
                      
                      {/* Search Icon or Chevron for consistent look */}
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400 dark:text-gray-500">
                        <MapPin size={16} />
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {showLocationDropdown && (locationResults.length > 0 || (locationQuery.length >= 2)) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                          {locationResults.length > 0 ? (
                            locationResults.map((prov) => (
                              <div key={prov.provinceId} className="p-2 border-b last:border-0 border-gray-100 dark:border-gray-700">
                                <div 
                                  className="px-3 py-1 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900/50 rounded-md mb-1 cursor-pointer hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  onClick={() => handleLocationSelect('province', prov.provinceId, prov.provinceName)}
                                >
                                   {prov.provinceName} Province
                                </div>
                                {prov.districts.map((dist) => (
                                  <div key={dist.districtId} className="ml-1 mb-2">
                                    <button
                                       onClick={() => handleLocationSelect('district', dist.districtId, dist.districtName)}
                                       className="w-full text-left px-3 py-1.5 text-sm sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center justify-between group"
                                    >
                                      {dist.districtName} District
                                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    <div className="ml-2 mt-1 flex flex-wrap gap-1 px-2">
                                      {dist.cities.map((city) => (
                                        <button
                                          key={city.cityId}
                                          onClick={() => handleLocationSelect('city', city.cityId, city.cityName)}
                                          className="text-left px-2 py-1 text-[13px] sm:text-[11px] text-gray-600 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-700/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-900 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-all font-medium"
                                        >
                                          {city.cityName}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : locationQuery.length >= 2 ? (
                            <div className="p-6 text-center text-gray-400 italic text-sm">
                              No matching locations found...
                            </div>
                          ) : null}
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Error State */}
              {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

              {/* Loading State */}
              {loading && (
                  <div className="flex justify-center py-12">
                      <Loader className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                  </div>
              )}

              {/* Results Grid */}
              {!loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
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
                            time={`${cls.dayOfWeek} ${formatTime(cls.startTime)}`}
                            students={cls.studentCount}
                            status={cls.status}
                            fee={cls.fee}
                            classType={cls.classType}
                            tutorImage={cls.tutorImageUrl}
                            instituteName={cls.instituteName || "Tutor's Own Place"}
                            hallName={cls.instituteName ? cls.hallName : null}
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
                        <Search size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="font-medium">No classes found.</p>
                        <p className="text-sm">Try adjusting your search terms.</p>
                      </div>
                    )}
                  </div>
              )}

              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center p-6 text-blue-500 gap-2">
                    <Loader size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Loading more classes...</span>
                </div>
              )}

              {!hasMore && availableClasses.length > 0 && (
                <div className="text-center p-8 text-sm text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-800/50 mt-4">
                    No more classes matching your search.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmJoinRequest}
        title="Join Class?"
        message="Are you sure you want to send a request to join this class? The tutor will need to approve your request."
        confirmLabel="Send Request"
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ClassSearchModal;