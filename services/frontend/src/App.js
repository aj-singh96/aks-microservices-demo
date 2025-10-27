import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '' });

  // Get API URL from environment or use default
  const apiUrl = process.env.REACT_APP_API_URL || '/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/users`);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Is the API service running?');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
}

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post(`${apiUrl}/users`, newUser);
    setNewUser({ name: '', email: '' });
    fetchUsers();
  } catch (err) {
    setError('Failed to create user');
    console.error('Error creating user:', err);
  }
};

const handleDelete = async (id) => {
  try {
    await axios.delete(`${apiUrl}/users/${id}`);
    fetchUsers();
  } catch (err) {
    setError('Failed to delete user');
    console.error('Error deleting user:', err);
  }
};


  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Microservices Demo on AKS</h1>
        <p>Frontend → API → PostgreSQL</p>
      </header>

      <main className="App-main">
        <div className="container">
          <section className="form-section">
            <h2>Add New User</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <button type="submit">Add User</button>
            </form>
          </section>
          <section className="users-section">
    <h2>Users List</h2>
    {loading && <p className="loading">Loading...</p>}
    {error && <p className="error">{error}</p>}
    {!loading && !error && users.length === 0 && (
      <p className="no-data">No users yet. Add one above!</p>
    )}
    {!loading && !error && users.length > 0 && (
      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <small>ID: {user.id}</small>
            <button
              className="delete-btn"
              onClick={() => handleDelete(user.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    )}
  </section>

  <footer className="App-footer">
    <p>Deployed on Azure Kubernetes Service | CI/CD with GitHub Actions</p>
  </footer>
</div>
);
}

export default App;