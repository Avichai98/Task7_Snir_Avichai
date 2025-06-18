import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import User from './User.js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load env vars
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_INITDB_ROOT_USERNAME
  ? `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`
  : 'mongodb://localhost:27017/testdb';

beforeAll(async () => {
  await mongoose.connect(mongoUri);
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

app.get('/api/users', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  const user = new User({ name, email });
  await user.save();
  res.status(201).json(user);
});

describe('Users API', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test User');
    expect(res.body.email).toBe('test@example.com');
  });

  it('should get all users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
