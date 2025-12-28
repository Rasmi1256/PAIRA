import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Our Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Uploads Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Uploads</h2>
          {/* Placeholder for recent uploads */}
          <p className="text-gray-500">Your latest shared moments will appear here.</p>
        </div>

        {/* "Today in past years" memories Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Today in Past Years</h2>
          {/* Placeholder for memories */}
          <p className="text-gray-500">A look back at your memories from this day.</p>
        </div>

        {/* Timeline Section */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1 md:col-span-2 lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Timeline</h2>
          {/* Placeholder for timeline */}
          <p className="text-gray-500">Your relationship timeline will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;