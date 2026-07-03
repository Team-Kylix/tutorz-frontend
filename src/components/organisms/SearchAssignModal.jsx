import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import { Search, MapPin, Building, Phone, User, CheckCircle, Send } from 'lucide-react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import { validatePhoneNumber } from '../../utils/validators';

const SearchAssignModal = ({ isOpen, onClose, onSendRequest, searchFunction, entityType = 'Tutor', isLoadingAction = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);

  // Reset state when opening/closing
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Validation
    const cleanQuery = searchQuery.trim();
    if (/^\d+$/.test(cleanQuery) || cleanQuery.startsWith('07')) {
       const validation = validatePhoneNumber(cleanQuery);
       if (!validation.isValid) {
           setError(validation.message);
           setSearchResult(null);
           return;
       }
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const data = await searchFunction(cleanQuery);
      setSearchResult(data); // Expecting exactly one result for exact match
    } catch (err) {
      setError(err.message || `Failed to find ${entityType}.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = () => {
    if (searchResult) {
      // The role specific ID is the TutorId or InstituteId
      onSendRequest(searchResult.roleSpecificId);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send Join Request to ${entityType}`}>
      <form onSubmit={handleSearch} className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search by Mobile Number or Registration Number
        </label>
        <div className="flex gap-2">
          <Input
            placeholder={`e.g., 0712345678 or REG-123`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            icon={Search}
          />
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </form>

      {searchResult && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300 overflow-hidden flex-shrink-0">
               {searchResult.profileImageUrlSmall ? (
                  <img src={searchResult.profileImageUrlSmall} alt={searchResult.name} className="w-full h-full object-cover" />
               ) : (
                  (searchResult.name || "U").charAt(0)
               )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {searchResult.name}
              </h4>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                {entityType === 'Institute' ? <Building size={14} /> : <User size={14} />}
                <span className="truncate">{searchResult.registrationNumber}</span>
              </div>
              {searchResult.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <Phone size={14} />
                  <span>{searchResult.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
             {searchResult.isAlreadyAssigned ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-sm font-medium bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg">
                  <CheckCircle size={16} />
                  Already Joined or Request Pending
                </div>
             ) : (
                <Button 
                   onClick={handleSendRequest} 
                   isLoading={isLoadingAction}
                   className="gap-2"
                >
                   <Send size={16} />
                   Send Join Request
                </Button>
             )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SearchAssignModal;
