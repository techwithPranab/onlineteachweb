import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Calendar,
  ExternalLink
} from 'lucide-react';
import notificationService from '@/services/notificationService';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading } = useQuery(
    'notifications',
    () => notificationService.getNotifications({ limit: 10 }),
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Fetch unread count
  const { data: unreadData } = useQuery(
    'unreadNotificationCount',
    () => notificationService.getUnreadCount(),
    { refetchInterval: 30000 }
  );

  const unreadCount = unreadData?.unreadCount || 0;
  const notifications = data?.notifications || [];

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (id) => notificationService.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotificationCount');
      }
    }
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    () => notificationService.markAllAsRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotificationCount');
      }
    }
  );

  // Delete notification mutation
  const deleteMutation = useMutation(
    (id) => notificationService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotificationCount');
      }
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ai_generation_complete':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'quiz_results_published':
        return <ClipboardList className="w-5 h-5 text-green-500" />;
      case 'manual_evaluation_needed':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'quiz_published':
      case 'quiz_archived':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'upcoming_quiz':
        return <Calendar className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'ai_generation_complete':
        return '/tutor/ai-questions/review';
      case 'quiz_results_published':
        return `/student/quiz/${notification.relatedId}/results`;
      case 'manual_evaluation_needed':
        return `/tutor/evaluate/${notification.relatedId}`;
      case 'quiz_published':
      case 'quiz_archived':
        return `/tutor/quizzes/${notification.relatedId}/edit`;
      case 'upcoming_quiz':
        return `/student/quiz/${notification.relatedId}/attempt`;
      default:
        return null;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  const handleNotificationClick = useCallback((notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
    setIsOpen(false);
  }, [markAsReadMutation]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const Content = (
                  <div
                    className={`flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-start gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            markAsReadMutation.mutate(notification._id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteMutation.mutate(notification._id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );

                return link ? (
                  <Link
                    key={notification._id}
                    to={link}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {Content}
                  </Link>
                ) : (
                  <div key={notification._id} onClick={() => handleNotificationClick(notification)}>
                    {Content}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
