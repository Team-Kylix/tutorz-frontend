import { 
  Users, 
  DollarSign, 
  BookOpen, 
  CreditCard 
} from 'lucide-react';


export const MOCK_INSTITUTES = [
  { id: 'inst1', name: 'Sasip Institute - Nugegoda' },
  { id: 'inst2', name: 'Rotary International' },
  { id: 'inst3', name: 'Sakya Institute' },
  { id: 'inst4', name: 'Sipwin - Kurunegala' }
];

export const MOCK_SUBJECTS = [
  "Mathematics", "Science", "Sinhala", "English", "History", "Buddhism",
  "Geography", "Civic Education", "ICT", "Health Science",
  "Commerce", "Art", "Music", "Dancing", "Tamil Language",
  "Combined Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science",
  "Economics", "Business Studies", "Accounting", "Political Science", "Logic",
  "Media Studies", "English Literature"
];

export const MOCK_USER = {
  name: "Vinod Warnakulasooriya",
  role: "Tutor",
  profileImage: "https://ui-avatars.com/api/?name=Vinod+W&background=0D8ABC&color=fff",
  tutorId: "T-8821"
};

export const STATS_DATA = [
  { label: "Total Students", value: "142", icon: Users, color: "bg-blue-100 text-blue-600", change: "+12%" },
  { label: "Monthly Income", value: "LKR 125,000", icon: DollarSign, color: "bg-green-100 text-green-600", change: "+5.4%" },
  { label: "Active Classes", value: "08", icon: BookOpen, color: "bg-purple-100 text-purple-600", change: "0" },
  { label: "Pending Withdrawals", value: "LKR 25,000", icon: CreditCard, color: "bg-orange-100 text-orange-600", change: "Pending" },
];

export const UPCOMING_CLASSES_DATA = [
  { id: 1, subject: "Grade 11 Mathematics", time: "02:30 PM - 04:30 PM", hall: "Hall A", students: 45, status: "Starting Soon" },
  { id: 2, subject: "A/L Physics Revision", time: "05:00 PM - 07:00 PM", hall: "Hall B", students: 62, status: "Scheduled" },
];