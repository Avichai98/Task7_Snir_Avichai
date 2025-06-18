import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Users from './Users';

// Mock fetch
beforeEach(() => {
  global.fetch = jest.fn((url, options) => {
    if (url?.toString().endsWith('/api/users') && (!options || options.method === 'GET')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { _id: '1', name: 'דני', email: 'dani@example.com', createdAt: new Date().toISOString() },
        ]),
      }) as any;
    }
    if (url?.toString().endsWith('/api/users') && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ _id: '2', name: 'שרה', email: 'sara@example.com', createdAt: new Date().toISOString() }),
      }) as any;
    }
    return Promise.reject(new Error('not found'));
  });
});
afterEach(() => {
  jest.resetAllMocks();
});

test('renders user list and add user form', async () => {
  render(<Users />);
  expect(screen.getByText('הרשמת משתמשים')).toBeInTheDocument();
  expect(await screen.findByText('דני')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('שם')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('אימייל')).toBeInTheDocument();
});

test('can add a new user', async () => {
  render(<Users />);
  fireEvent.change(screen.getByPlaceholderText('שם'), { target: { value: 'שרה' } });
  fireEvent.change(screen.getByPlaceholderText('אימייל'), { target: { value: 'sara@example.com' } });
  fireEvent.click(screen.getByText('הוסף משתמש'));
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/users'),
    expect.objectContaining({ method: 'POST' })
  ));
});
