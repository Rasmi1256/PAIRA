import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const CalendarView: React.FC = () => {
  return (
    <div
      className="
        w-full 
        rounded-lg 
        p-4 
        mb-4 
        cursor-pointer 
        transition-all 
        duration-300 
        bg-gradient-to-br from-indigo-600 to-blue-700
        hover:from-indigo-500 hover:to-blue-600
        shadow-md 
        hover:shadow-xl
        text-white
      "
    >
      <div className="flex items-center mb-2">
        <FaCalendarAlt className="text-2xl mr-3 drop-shadow-sm" />
        <h2 className="text-lg font-semibold">Calendar</h2>
      </div>

      <div className="text-xs opacity-90 leading-relaxed">
        Your shared calendar will appear here.
        <br />
        <span className="opacity-75">Plan your dates & remember special days.</span>
      </div>
    </div>
  );
};

export default CalendarView;
