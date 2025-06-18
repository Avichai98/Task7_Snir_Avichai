import React, { useEffect, useState } from 'react';

// const API_BASE_URL = 'http://localhost:8080'; // this is local
const API_BASE_URL = `http://20.217.201.167:8080`; // this is azure vm

type User = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/api/users`);
    setUsers(await res.json());
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    setName('');
    setEmail('');
    fetchUsers();
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', background: '#f9f9f9', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ textAlign: 'center' }}>Register</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          placeholder="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button style={{ padding: 10, borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          הוסף משתמש
        </button>
      </form>
      <hr style={{ margin: '24px 0' }} />
      <h3 style={{ textAlign: 'center' }}>Exist Users</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(u => (
          <li key={u._id} style={{ background: '#fff', margin: '8px 0', padding: 10, borderRadius: 6, boxShadow: '0 1px 3px #0001' }}>
            <b>{u.name}</b> <br />
            <span style={{ color: '#555' }}>{u.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
