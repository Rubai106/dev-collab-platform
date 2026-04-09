import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext } from 'react-beautiful-dnd';
import { useSocket } from '../context/SocketContext';
import TaskColumn from '../components/TaskColumn';
import TaskModal from '../components/TaskModal';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';

const statuses = ['Todo', 'In Progress', 'Completed'];

const TaskBoard = () => {
  const { id: projectId } = useParams();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tasksRes, projectRes] = await Promise.all([
        api.get(`/tasks/project/${projectId}`),
        api.get(`/projects/${projectId}`),
      ]);
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      setTasks(tasksData);
      setProject(projectRes.data);
    } catch (err) {
      toast.error('Failed to load task board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (socket) {
      socket.emit('joinRoom', projectId);
      socket.on('taskUpdated', (updatedTasks) => {
        if (Array.isArray(updatedTasks)) {
          setTasks(updatedTasks);
        } else {
          fetchData();
        }
      });
      return () => {
        socket.emit('leaveRoom', projectId);
        socket.off('taskUpdated');
      };
    }
  }, [socket, projectId]);

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newTasks = [...tasks];
    const sourceTasks = newTasks.filter((t) => t.status === source.droppableId);
    const [moved] = sourceTasks.splice(source.index, 1);
    moved.status = destination.droppableId;

    const destTasks = newTasks.filter(
      (t) => t.status === destination.droppableId && t._id !== moved._id
    );
    destTasks.splice(destination.index, 0, moved);

    const reordered = statuses.flatMap((status) => {
      const group = status === destination.droppableId
        ? destTasks
        : status === source.droppableId
          ? sourceTasks
          : newTasks.filter((t) => t.status === status);
      return group.map((t, i) => ({ ...t, order: i }));
    });

    setTasks(reordered);

    try {
      await api.put('/tasks/reorder/batch', {
        tasks: reordered.map((t) => ({ _id: t._id, status: t.status, order: t.order })),
      });
      if (socket) {
        socket.emit('taskUpdate', { room: projectId, tasks: reordered });
      }
    } catch (err) {
      toast.error('Failed to reorder');
      fetchData();
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData._id) {
        const res = await api.put(`/tasks/${taskData._id}`, taskData);
        setTasks((prev) => prev.map((t) => (t._id === res.data._id ? res.data : t)));
      } else {
        const res = await api.post('/tasks', { ...taskData, project: projectId });
        setTasks((prev) => [...prev, res.data]);
      }
      setModalOpen(false);
      setEditingTask(null);
      if (socket) socket.emit('taskUpdate', { room: projectId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="task-board">
      <div className="page-header">
        <h1>{project?.title} — Tasks</h1>
        <button className="btn btn-primary" onClick={() => { setEditingTask(null); setModalOpen(true); }}>
          <FiPlus /> Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {statuses.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order)}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </DragDropContext>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          members={project?.members || []}
          onSave={handleSaveTask}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
};

export default TaskBoard;
