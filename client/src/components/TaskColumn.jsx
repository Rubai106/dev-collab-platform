import { Droppable, Draggable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';

const TaskColumn = ({ status, tasks, onTaskClick }) => {
  const statusLabels = {
    Todo: 'To Do',
    'In Progress': 'In Progress',
    Completed: 'Completed',
  };

  return (
    <div className="task-column">
      <div className="column-header">
        <h3>{statusLabels[status]}</h3>
        <span className="task-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`column-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(provided) => (
                  <TaskCard
                    task={task}
                    onClick={onTaskClick}
                    provided={provided}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default TaskColumn;
