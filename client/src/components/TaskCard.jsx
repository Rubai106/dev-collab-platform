import { FiUser, FiFlag } from 'react-icons/fi';

const priorityColors = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

const TaskCard = ({ task, onClick, provided }) => {
  return (
    <div
      className="task-card"
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onClick(task)}
    >
      <div className="task-card-header">
        <h4>{task.title}</h4>
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColors[task.priority] || '#6b7280' }}
        >
          <FiFlag size={10} /> {task.priority}
        </span>
      </div>
      {task.description && <p className="task-desc">{task.description}</p>}
      {task.assignedTo && (
        <div className="task-assignee">
          <FiUser size={12} />
          <span>{task.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
