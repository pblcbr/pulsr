// src/components/PostEditModal.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { postsService } from '../services/postService';

const PostEditModal = ({ post, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'draft',
    scheduled_at: '',
    pillar_name: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        status: post.status || 'draft',
        scheduled_at: post.scheduled_at ? format(new Date(post.scheduled_at), 'yyyy-MM-dd') : '',
        pillar_name: post.pillar_name || ''
      });
    }
  }, [post]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare the data for update
      const updateData = {
        ...formData,
        // Convert date string to ISO format if it exists
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null
      };
      
      console.log('Updating post with data:', updateData);
      const updatedPost = await postsService.updatePost(post.id, updateData);
      console.log('Post updated successfully:', updatedPost);
      
      onSave(updatedPost);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setSaving(true);
      try {
        await postsService.deletePost(post.id);
        onSave(null); // Indicate that the post was deleted
        onClose();
      } catch (error) {
        console.error('Error deleting post:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Post</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Status and date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled date
              </label>
              <input
                type="date"
                lang="en-US"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({...formData, scheduled_at: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{ colorScheme: 'light' }}
              />
            </div>
          </div>

          {/* Pillar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content pillar
            </label>
            <input
              type="text"
              value={formData.pillar_name}
              onChange={(e) => setFormData({...formData, pillar_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditModal;