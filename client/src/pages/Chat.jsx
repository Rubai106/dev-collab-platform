import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { FiSend } from 'react-icons/fi';

const Chat = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [project, setProject] = useState(null);
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgsRes, projRes] = await Promise.all([
          api.get(`/messages/${projectId}`),
          api.get(`/projects/${projectId}`),
        ]);
        setMessages(msgsRes.data);
        setProject(projRes.data);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (socket) {
      socket.emit('joinRoom', projectId);

      socket.on('newMessage', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('typing', ({ userName }) => {
        setTyping((prev) => [...new Set([...prev, userName])]);
      });

      socket.on('stopTyping', ({ userName }) => {
        setTyping((prev) => prev.filter((n) => n !== userName));
      });

      return () => {
        socket.emit('leaveRoom', projectId);
        socket.off('newMessage');
        socket.off('typing');
        socket.off('stopTyping');
      };
    }
  }, [socket, projectId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', { room: projectId, userName: user.name });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stopTyping', { room: projectId, userName: user.name });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await api.post('/messages', { text, project: projectId });
      if (socket) {
        socket.emit('sendMessage', { room: projectId, message: res.data });
        socket.emit('stopTyping', { room: projectId, userName: user.name });
      }
      setText('');
    } catch (err) {
      // silent
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const onlineMembers = project?.members?.filter((m) =>
    Array.isArray(onlineUsers) && onlineUsers.some((ou) => ou.userId === m._id)
  ) || [];

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h3>{project?.title}</h3>
        <div className="online-section">
          <h4>Online ({onlineMembers.length})</h4>
          {onlineMembers.map((m) => (
            <div key={m._id} className="online-user">
              <div className="avatar-small online">
                {m.profilePicture ? (
                  <img src={m.profilePicture} alt={m.name} />
                ) : (
                  <span>{m.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span>{m.name}</span>
            </div>
          ))}
        </div>
        <div className="members-section-chat">
          <h4>All Members ({project?.members?.length})</h4>
          {project?.members?.map((m) => (
            <div key={m._id} className="member-item-small">
              <div className="avatar-small">
                {m.profilePicture ? (
                  <img src={m.profilePicture} alt={m.name} />
                ) : (
                  <span>{m.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="date-divider"><span>{date}</span></div>
              {msgs.map((msg) => (
                <div
                  key={msg._id}
                  className={`message ${msg.sender?._id === user._id ? 'own' : ''}`}
                >
                  <div className="message-avatar">
                    <div className="avatar-small">
                      {msg.sender?.profilePicture ? (
                        <img src={msg.sender.profilePicture} alt={msg.sender.name} />
                      ) : (
                        <span>{msg.sender?.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <strong>{msg.sender?.name}</strong>
                      <small>{formatTime(msg.createdAt)}</small>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEnd} />
        </div>

        {typing.length > 0 && (
          <div className="typing-indicator">
            {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <form className="chat-input" onSubmit={handleSend}>
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            placeholder="Type a message..."
          />
          <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
