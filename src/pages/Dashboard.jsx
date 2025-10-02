// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import CalendarGrid from '../components/CalendarGrid';
import PostEditModal from '../components/PostEditModal';


const Dashboard = () => {
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };
  const handlePostSave = (updatedPost) => {
    // Trigger a refresh of the CalendarGrid
    setRefreshTrigger(prev => prev + 1);
    setSelectedPost(null);
    setIsModalOpen(false);
  };


  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Content Calendar
            </h1>
            
            <CalendarGrid 
              userId={user?.id} 
              onPostClick={handlePostClick}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </main>
      </div>

      <PostEditModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handlePostSave}
      />
    </div>
  );
};

export default Dashboard;