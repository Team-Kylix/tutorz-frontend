import { CheckCircle, BookOpen, DollarSign, Award } from 'lucide-react';

export const STUDENT_STATS = [
  {
    label: "Attendance Rate",
    value: "85%",
    icon: CheckCircle,
    color: "bg-green-100 text-green-600",
    change: "+2%"
  },
  {
    label: "Enrolled Classes",
    value: "04",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-600",
    change: "Active"
  },
  {
    label: "Due Fees",
    value: "LKR 2,500",
    icon: DollarSign,
    color: "bg-red-100 text-red-600",
    change: "1 Pending"
  },
  {
    label: "Medals Earned",
    value: "12",
    icon: Award,
    color: "bg-yellow-100 text-yellow-600",
    change: "+1 New"
  }
];

export const ENROLLED_CLASSES = [
  {
    id: 1,
    subject: "Mathematics",
    grade: "Grade 10",
    tutorName: "Mr. Bandara",
    time: "Mon 2:30 PM",
    fee: "2500",
    status: "active",
    classType: "Class"
  },
  {
    id: 2,
    subject: "Science",
    grade: "Grade 10",
    tutorName: "Ms. Perera",
    time: "Wed 4:00 PM",
    fee: "2000",
    status: "active",
    classType: "Class"
  },
  {
    id: 3,
    subject: "O/L History Seminar",
    grade: "Grade 11",
    tutorName: "Dr. Silva",
    time: "Sat 8:00 AM",
    fee: "1500",
    status: "active",
    classType: "Seminar"
  }
];