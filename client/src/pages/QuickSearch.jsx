import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiSearch, FiFilter, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './QuickSearch.css';

const QuickSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedToMe: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length > 0) {
      searchTasks();
    } else {
      setResults([]);
    }
  }, [query, filters]);

  const searchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      let allTasks = response.data;

      // Apply text search
      allTasks = allTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.description.toLowerCase().includes(query.toLowerCase())
      );

      // Apply filters
      if (filters.status !== 'all') {
        allTasks = allTasks.filter((task) => task.status === filters.status);
      }
      if (filters.priority !== 'all') {
        allTasks = allTasks.filter((task) => task.priority === filters.priority);
      }
      if (filters.assignedToMe) {
        allTasks = allTasks.filter((task) => task.assignedTo === localStorage.getItem('userId'));
      }

      setResults(allTasks.slice(0, 10));
    } catch (error) {
      console.error('Error searching tasks:', error);
      toast.error('Failed to search tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    navigate(`/projects/${task.project}/tasks`, { state: { selectedTask: task._id } });
  };

  return (
    <div className="quick-search-container">
      <div className="search-header">
        <h1>🔍 Quick Search</h1>
        <p>Find tasks across all your projects</p>
      </div>

      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search tasks by title or description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="search-filters">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="all">All</option>
            <option value="Todo">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
          >
            <option value="all">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="filter-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={filters.assignedToMe}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  assignedToMe: e.target.checked,
                })
              }
            />
            Assigned to me
          </label>
        </div>
      </div>

      <div className="search-results">
        {loading && <div className="loading">Searching...</div>}

        {query && results.length === 0 && !loading && (
          <div className="no-results">
            <p>No tasks found matching your search</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-list">
            <h3>{results.length} results found</h3>
            {results.map((task) => (
              <div
                key={task._id}
                className="result-item"
                onClick={() => handleTaskClick(task)}
              >
                <div className="result-content">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <div className="result-meta">
                    <span className={`status-badge ${task.status.toLowerCase().replace(' ', '-')}`}>
                      {task.status}
                    </span>
                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <FiChevronRight className="result-arrow" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickSearch;
