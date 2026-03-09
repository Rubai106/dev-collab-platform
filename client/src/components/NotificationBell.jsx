import { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

const NotificationBell = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
      return () => socket.off('notification');
    }
  }, [socket]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // silent
    }
  };

  return (
    <div className="notification-bell">
      <button className="bell-btn" onClick={() => setOpen(!open)}>
        <FiBell />
        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="empty-text">No notifications</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div key={n._id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
