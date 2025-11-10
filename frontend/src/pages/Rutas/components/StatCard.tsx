import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  titulo: string;
  valor: string | number;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ icon, titulo, valor, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{titulo}</p>
      <p className="text-3xl font-bold text-gray-900">{valor}</p>
    </div>
  );
};

export default StatCard;