import React, { useState } from 'react';
import { 
  Users, GraduationCap, Calendar, DollarSign, 
  Plus, QrCode, UserPlus, Loader2, Save
} from 'lucide-react';

// --- Existing Components ---
import Button from '../../../components/atoms/Button';
import SectionTitle from '../../../components/atoms/SectionTitle';
import Select from '../../../components/atoms/Select'; 
import StatCard from '../../../components/molecules/StatCard';
import Modal from '../../../components/molecules/Modal';
import FormField from '../../../components/molecules/FormField';
import QuickActionCard from '../../../components/molecules/QuickActionCard';
import ConfirmationModal from '../../../components/molecules/ConfirmationModal';

// --- Services ---
import { checkUserStatus, register } from '../../../services/auth/authService';

// --- Constants ---
const MOCK_STATS = [
  { label: 'Total Tutors', value: '24', change: '+2 this month', icon: Users, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { label: 'Active Students', value: '856', change: '+12% vs last mo', icon: GraduationCap, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  { label: 'Classes Today', value: '42', change: '+8 Live Now', icon: Calendar, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: 'Revenue (Dec)', value: 'Rs 12,450', change: '+5% growth', icon: DollarSign, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
];

const GRADE_GROUPS = [
    { label: "Primary Education", options: ['Preschool','Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
    { label: "Secondary Education", options: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11 (O/L)','Grade 12 (A/L)', 'Grade 13 (A/L)'] },
    { label: "Other", options: ['Course', 'Seminar', 'Workshop'] }
];

const InstituteDashboard = ({ user }) => {
  // --- Modal States ---
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);        
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);        
  const [isExistingUserModalOpen, setIsExistingUserModalOpen] = useState(false); 
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false); 
  // NEW: Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState({ title: '', message: '' });

  // --- Logic States ---
  const [checkData, setCheckData] = useState({ email: '', mobile: '' });
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 
  const [checkError, setCheckError] = useState('');
  const [existingUser, setExistingUser] = useState(null);

  // --- Registration Form State (Simplified) ---
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    grade: ''
  });

  // Open Selection
  const openSelection = () => {
      setIsSelectionModalOpen(true);
  };

  // Select "Add Student" -> Open Check Modal
  const handleSelectStudent = () => {
      setIsSelectionModalOpen(false);
      setCheckData({ email: '', mobile: '' });
      setCheckError('');
      setIsChecking(false); 
      setIsCheckModalOpen(true);
  };

  // Check User Existence
  const handleCheckUser = async (e) => {
      e.preventDefault();
      
      if (!checkData.email.trim() && !checkData.mobile.trim()) {
          setCheckError("Please enter at least a Mobile Number or Email.");
          return;
      }

      setIsChecking(true);
      setCheckError('');

      try {
          const result = await checkUserStatus({ 
              email: checkData.email, 
              phoneNumber: checkData.mobile 
          });

          // Close check modal immediately on success
          setIsCheckModalOpen(false);

          if (result.exists) {
              setExistingUser(result);
              setIsExistingUserModalOpen(true);
          } else {
              // User New -> Open Simplified Registration
              setFormData({ firstName: '', lastName: '', grade: '' }); // Reset form
              setIsRegisterModalOpen(true);
          }
      } catch (err) {
          setCheckError("Failed to verify user. Please try again.");
          // Keep modal open if error to allow retry
      } finally {
          setIsChecking(false); 
      }
  };

  // Final Register (Updated with Confirmation Modal)
  const handleRegister = async (e) => {
      e.preventDefault();
      setIsRegistering(true);

      try {
          // --- PASSWORD LOGIC START ---
          const mobileStr = checkData.mobile.trim();
          
          // Get the last 6 digits. 
          // If the number is too short (unlikely), fallback to "123456" to satisfy backend.
          const generatedPassword = mobileStr.length >= 6 
              ? mobileStr.slice(-6) 
              : "123456"; 

          const payload = {
              firstName: formData.firstName,
              lastName: formData.lastName,
              grade: formData.grade,
              role: "Student",
              email: checkData.email || `student.${mobileStr}@tutorz.lk`, 
              phoneNumber: mobileStr,
              password: generatedPassword, 
              schoolName: "Not Provided",
              parentName: "Not Provided",
              dateOfBirth: new Date().toISOString() 
          };

          await register(payload);
          
          // Close Register Modal
          setIsRegisterModalOpen(false);

          // Configure and Open Success Confirmation Modal
          setSuccessData({
              title: "Registration Successful",
              message: `Student account created successfully.\n\nDefault Password: ${generatedPassword}`
          });
          setIsSuccessModalOpen(true);

      } catch (err) {
          alert(err.message || "Registration Failed");
      } finally {
          setIsRegistering(false);
      }
  };

  return (
    <div className="p-2 md:p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Institute Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.firstName || 'Admin'}</p>
         </div>
         <div className="flex gap-3">
           <Button variant="outline"><QrCode size={18} className="mr-2" /> Scan QR</Button>
           <Button variant="primary" onClick={openSelection}><Plus size={18} className="mr-2" /> Add New</Button>
         </div>
      </div>

      {/* --- Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))} 
      </div>

      {/* --- Main Content --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
             <SectionTitle title="Today's Classes" />
             <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No classes scheduled right now.</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
           <div className="p-4 border-b border-gray-100 dark:border-gray-700">
             <h3 className="font-bold text-gray-900 dark:text-white">New Registrations</h3>
           </div>
           <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No new registrations today.</div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* SELECTION MODAL */}
      <Modal 
        isOpen={isSelectionModalOpen} 
        onClose={() => setIsSelectionModalOpen(false)} 
        title="What would you like to add?"
      >
        <div className="grid grid-cols-2 gap-4">
            <QuickActionCard 
                icon={GraduationCap} 
                label="Add Student" 
                colorClass="text-blue-600 dark:text-blue-400"
                onClick={handleSelectStudent}
            />
            <QuickActionCard 
                icon={UserPlus} 
                label="Add Tutor" 
                colorClass="text-purple-600 dark:text-purple-400"
                onClick={() => console.log("Add Tutor")}
            />
        </div>
      </Modal>

      {/*  CHECK USER MODAL */}
      <Modal 
        isOpen={isCheckModalOpen} 
        onClose={() => setIsCheckModalOpen(false)} 
        title="Register Student"
      >
        <form onSubmit={handleCheckUser} className="space-y-4">
            <div className="space-y-4">
                <FormField 
                    id="mobile"
                    label="Mobile Number"
                    placeholder="e.g. 0771234567"
                    value={checkData.mobile}
                    onChange={(e) => setCheckData({...checkData, mobile: e.target.value})}
                    autoFocus
                />
                <FormField 
                    id="email"
                    label="Email Address (Optional)"
                    placeholder="student@example.com"
                    value={checkData.email}
                    onChange={(e) => setCheckData({...checkData, email: e.target.value})}
                />
            </div>

            {checkError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> {checkError}
                </p>
            )}

            <Button type="submit" fullWidth disabled={isChecking}>
                {isChecking ? 'Checking...' : 'Verify & Continue'}
            </Button>
        </form>
      </Modal>

      {/*  EXISTING USER MODAL */}
      <ConfirmationModal
        isOpen={isExistingUserModalOpen}
        onClose={() => setIsExistingUserModalOpen(false)}
        title="User Already Exists"
        message={`This user is already registered as ${existingUser?.name} [${existingUser?.role}].`}
        confirmLabel="View Profile"
        cancelLabel="Close"
        onConfirm={() => alert("Navigate to Profile")}
        variant="primary" 
      />

      {/*   NEW REGISTRATION MODAL */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="New Student Registration"
      >
        <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Mobile</p>
                    <p className="font-mono text-sm font-bold text-blue-800 dark:text-blue-300">{checkData.mobile || "N/A"}</p>
                </div>
                <div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Email</p>
                    <p className="font-mono text-sm font-bold text-blue-800 dark:text-blue-300 truncate">{checkData.email || "N/A"}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField 
                    id="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                />
                <FormField 
                    id="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grade
                </label>
                <Select
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    required
                >
                    <option value="">Select Grade</option>
                    {GRADE_GROUPS.map((group, index) => (
                        <optgroup key={index} label={group.label} className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
                            {group.options.map((opt) => (
                                <option key={opt} value={opt} className="text-gray-900 dark:text-white font-normal bg-white dark:bg-gray-800">{opt}</option>
                            ))}
                        </optgroup>
                    ))}
                </Select>
            </div>

            <div className="pt-4">
                <Button type="submit" fullWidth disabled={isRegistering}>
                    {isRegistering ? (
                        <><Loader2 size={18} className="animate-spin mr-2"/> Registering...</>
                    ) : (
                        <><Save size={18} className="mr-2"/> Register Student</>
                    )}
                </Button>
                {/* Updated Hint */}
                <p className="text-[10px] text-center text-gray-400 mt-2">
                    Default password will be last 6 digits of mobile
                </p>
            </div>
        </form>
      </Modal>

      {/*SUCCESS CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={successData.title}
        message={successData.message}
        confirmLabel="Done"
        cancelLabel="Close"
        onConfirm={() => setIsSuccessModalOpen(false)}
        variant="success" 
      />

    </div>
  );
};

export default InstituteDashboard;