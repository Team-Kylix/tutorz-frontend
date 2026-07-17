import React, { useEffect, useState, useRef } from 'react';
import { Users, DollarSign, BookOpen, CreditCard } from 'lucide-react';
import StatCard from '../molecules/StatCard';
import useApi from '../../hooks/useApi';
import * as tutorService from '../../services/api/tutorService';

const INITIAL_STATS = [
  { label: "Total Students", value: "0", icon: Users, color: "bg-blue-100 text-blue-600", change: "" },
  { label: "Monthly Income", value: "LKR 0", icon: DollarSign, color: "bg-green-100 text-green-600", change: "" },
  { label: "Active Classes", value: "00", icon: BookOpen, color: "bg-purple-100 text-purple-600", change: "" },
  { label: "Pending Withdrawals", value: "LKR 0", icon: CreditCard, color: "bg-orange-100 text-orange-600", change: "" },
];

const StatsGrid = ({ stats: propStats, children }) => {

  const [stats, setStats] = useState(propStats || INITIAL_STATS);
  const { request: fetchClasses } = useApi();

  useEffect(() => {
    const calculateRealStats = async () => {
      if (children) return; // Do not fetch tutor stats if used as a generic carousel
      // Fetch Real Data
      const { data: response, error } = await fetchClasses(tutorService.getDashboardStats);

      if (response && response.success && response.data) {
        const statsData = response.data;
        setStats(prevStats => prevStats.map(stat => {
          switch (stat.label) {
            case "Total Students":
              return { ...stat, value: (statsData.totalStudents || 0).toString() };
            case "Active Classes":
              return { ...stat, value: (statsData.activeClasses || 0).toString().padStart(2, '0') };
            case "Monthly Income":
              return { ...stat, value: `LKR ${(statsData.monthlyIncome || 0).toLocaleString()}` };
            case "Pending Withdrawals":
              return { ...stat, value: `LKR ${(statsData.pendingWithdrawals || 0).toLocaleString()}` };
            default:
              return stat;
          }
        }));
      }
    };

    calculateRealStats();
  }, []);

  const scrollContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const contentArray = children ? React.Children.toArray(children) : stats;
  const itemCount = contentArray.length;

  // Initialize scroll position to the middle set (SET 1) to allow both left and right infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && container.scrollWidth > container.clientWidth && itemCount > 0) {
      setTimeout(() => {
        const items = container.children;
        // Only initialize if we haven't already and there are enough items
        if (items.length >= itemCount * 3 && container.scrollLeft === 0) {
          const setWidth = items[itemCount].offsetLeft - items[0].offsetLeft;
          container.scrollTo({ left: setWidth, behavior: 'auto' });
        }
      }, 100);
    }
  }, [itemCount]);

  // Handle infinite scroll loop seamlessly during manual and auto scrolling
  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollWidth <= container.clientWidth || itemCount === 0) return;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    
    // Debounce the jump to happen after snap animation completes
    scrollTimeoutRef.current = setTimeout(() => {
      const items = container.children;
      if (items.length < itemCount * 3) return;
      
      const setWidth = items[itemCount].offsetLeft - items[0].offsetLeft;
      
      // If landed in SET 2 (scrolled past the end of SET 1)
      if (container.scrollLeft >= 2 * setWidth - 10) {
        container.scrollTo({ left: container.scrollLeft - setWidth, behavior: 'auto' });
      }
      // If landed in SET 0 (scrolled before the start of SET 1)
      else if (container.scrollLeft < setWidth - 10) {
        container.scrollTo({ left: container.scrollLeft + setWidth, behavior: 'auto' });
      }
    }, 150);
  };

  useEffect(() => {
    // If user is currently touching or hovering the carousel, pause auto-play
    if (isInteracting) return;

    const interval = setInterval(() => {
      const container = scrollContainerRef.current;
      if (container && container.scrollWidth > container.clientWidth && itemCount > 0) {
        // Scroll right by exactly one card width. CSS snap-mandatory will handle the exact positioning.
        container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
      }
    }, 2000); // 2 seconds interval

    return () => clearInterval(interval);
  }, [isInteracting, itemCount]);

  const infiniteContent = [...contentArray, ...contentArray, ...contentArray];

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex overflow-x-auto snap-x snap-mandatory gap-4 mb-6 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
    >
      {infiniteContent.map((item, index) => (
        <div 
          key={index} 
          className={`w-full shrink-0 snap-center md:w-auto md:shrink-[unset] md:snap-none flex flex-col ${index >= itemCount ? 'md:hidden' : ''}`}
        >
          {children ? item : <StatCard {...item} />}
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;