import React, { useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const ContentCard = ({ 
  content, 
  pillar, 
  onEdit, 
  onDelete, 
  onStatusChange,
  isCompact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!content) return null;

  const {
    id,
    title,
    body_md,
    summary,
    status,
    scheduled_at,
    published_at,
    hashtags = [],
    keywords
  } = content;

  const scheduledDate = new Date(scheduled_at);
  const publishedDate = published_at ? new Date(published_at) : null;

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: '📝',
      scheduled: '⏰',
      published: '✅',
      cancelled: '❌'
    };
    return icons[status] || icons.draft;
  };

  const formatTime = (date) => {
    return format(date, 'HH:mm', { locale: enUS });
  };

  const formatDate = (date) => {
    return format(date, 'dd MMM', { locale: enUS });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const safeBodyHtml = (body_md ?? '').replace(/\n/g, '<br>');

  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {formatTime(scheduledDate)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {getStatusIcon(status)} {status}
              </span>
            </div>
            {pillar && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: pillar.color }}
                title={pillar.name}
              />
            )}
          </div>

          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
            {title}
          </h4>

          <p className="text-xs text-gray-600 line-clamp-2">
            {summary || truncateText(body_md, 80)}
          </p>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hashtags.slice(0, 2).map((hashtag, index) => (
                <span key={index} className="text-xs text-blue-600">
                  {hashtag}
                </span>
              ))}
              {hashtags.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{hashtags.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-semibold text-gray-900">
                {formatTime(scheduledDate)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                {getStatusIcon(status)} {status}
              </span>
              {pillar && (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: pillar.color }}
                  />
                  <span className="text-sm text-gray-600">{pillar.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {formatDate(scheduledDate)}
              </span>
              {publishedDate && (
                <span className="text-sm text-green-600">
                  Published: {formatTime(publishedDate)}
                </span>
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="prose prose-sm max-w-none">
            <div 
              className="text-gray-700 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: safeBodyHtml
              }}
            />
          </div>

          {summary && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Summary:</strong> {summary}
              </p>
            </div>
          )}

          {keywords && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-1">Keywords:</p>
              <div className="flex flex-wrap gap-1">
                {keywords.split(',').map((keyword, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hashtags.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 mb-1">Hashtags:</p>
              <div className="flex flex-wrap gap-1">
                {hashtags.map((hashtag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {hashtag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={status}
              onChange={(e) => onStatusChange && onStatusChange(id, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <button
              onClick={() => onEdit && onEdit(content)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
            
            <button
              onClick={() => onDelete && onDelete(id)}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default ContentCard;
