import React from "react";

const Header: React.FC = () => {
  return (
    <div className="bg-[#1E1E1E] border-b border-gray-800 h-40 w-full">
      <div className="p-6">
        <div className="flex items-center justify-center mb-2">
          <div className="text-3xl mr-3">🎒</div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
            Tasks
          </h1>
        </div>
        <p className="text-gray-400 text-2xl flex justify-center">
          All the product team's tasks here!
        </p>
      </div>
    </div>
  );
};

export default Header;
