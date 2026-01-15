import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Sparkles,
  ClipboardList,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import notificationService from '@/services/notificationService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const limit = 20;
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data, isLoading, error } = useQuery(
    ['allNotifications', page, filter],
    () => notificationService.getNotifications({
      limit,
      skip: (page - 1) * limit,
      unreadOnly: filter === 'unread'
    })
  );

  const notifications = data?.notifications || [];
  const total = data?.total || 0;
  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.ceil(total / limit);

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    (id) => notificationService.markAsRead(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allNotifications');
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
        queryClient.invalidateQueries('allNotifications');
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotificationCount');
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id) => notificationService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allNotifications');
        queryClient.invalidateQueries('notifications');
        queryClient.invalidateQueries('unreadNotificationCount');
      }
    }
  );

  // Delete all read mutation
  const deleteAllReadMutation = useMutation(
    () => notificationService.deleteAllRead(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('allNotifications');
        queryClient.invalidateQueries('notifications');
      }
    }
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ai_generation_complete':
        return <Sparkles className="w-6 h-6 text-purple-500" />;
      case 'quiz_results_published':
        return <ClipboardList className="w-6 h-6 text-green-500" />;
      case 'manual_evaluation_needed':
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case 'quiz_published':
      case 'quiz_archived':
        return <Calendar className="w-6 h-6 text-blue-500" />;
      case 'upcoming_quiz':
        return <Calendar className="w-6 h-6 text-yellow-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isLoading}
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
          <button
            onClick={() => deleteAllReadMutation.mutate()}
            disabled={deleteAllReadMutation.isLoading}
            className="btn-secondary text-sm flex items-center gap-1 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-1">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {filter === 'unread' ? 'All caught up!' : 'Nothing here yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification._id)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
