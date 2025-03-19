import React from 'react';

const Loading = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <div className="flex items-center justify-center w-full py-8">
      <div 
        className={`${sizeClasses[size] || sizeClasses.md} animate-spin rounded-full border-t-2 border-b-2 border-blue-600 dark:border-blue-400`}
        role="status"
      >
        <span className="sr-only">Yükleniyor...</span>
      </div>
    </div>
  );
};

export default Loading;