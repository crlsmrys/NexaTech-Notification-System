/**
 * NexaTech Notification System - Server 1 (Primary Server on Port 3000)
 * 
 * Features:
 * - Real-time WebSocket communication using Socket.IO
 * - Redis pub/sub for cross-server message synchronization
 * - User role management (Lecturer/Student)
 * - Message broadcasting
 * - Connected users tracking
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const redis = require('redis');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIO(server, {
  cors: config.socketIO.cors,
  reconnection: config.socketIO.reconnection,
  reconnectionDelay: config.socketIO.reconnectionDelay,
  reconnectionDelayMax: config.socketIO.reconnectionDelayMax,
  reconnectionAttempts: config.socketIO.reconnectionAttempts
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Redis Publishers and Subscribers
let redisPublisher;
let redisSubscriber;

// Store connected users
const connectedUsers = new Map();

// Initialize Redis connection
async function initializeRedis() {
  try {
    redisPublisher = redis.createClient({
      host: config.redis.host,
      port: config.redis.port,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisSubscriber = redis.createClient({
      host: config.redis.host,
      port: config.redis.port,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
    redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

    await redisPublisher.connect();
    await redisSubscriber.connect();

    console.log('✅ Redis connected successfully');

    // Subscribe to Redis channels
    await subscribeToRedisChannels();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️  Continuing without Redis (single server mode)');
  }
}

// Subscribe to Redis channels
async function subscribeToRedisChannels() {
  try {
    await redisSubscriber.subscribe(config.channels.announcements, (message) => {
      const data = JSON.parse(message);
      // Broadcast received message from other server to all connected clients
      io.emit('new_message', data);
    });

    await redisSubscriber.subscribe(config.channels.responses, (message) => {
      const data = JSON.parse(message);
      io.emit('new_response', data);
    });

    await redisSubscriber.subscribe(config.channels.userPresence, (message) => {
      const data = JSON.parse(message);
      io.emit('user_presence_update', data);
    });

    console.log('✅ Subscribed to Redis channels');
  } catch (error) {
    console.error('❌ Redis subscription failed:', error);
  }
}

// Publish message to Redis
async function publishToRedis(channel, data) {
  try {
    if (redisPublisher && redisPublisher.isOpen) {
      await redisPublisher.publish(channel, JSON.stringify(data));
    }
  } catch (error) {
    console.error('❌ Redis publish error:', error);
  }
}

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`📱 New connection: ${socket.id}`);

  // User joins
  socket.on('user_join', (userData) => {
    const userId = socket.id;
    const user = {
      id: userId,
      name: userData.name,
      role: userData.role,
      joinedAt: new Date(),
      server: config.server1.name
    };

    connectedUsers.set(userId, user);

    // Broadcast user joined to all clients on this server
    io.emit('user_joined', {
      user: user,
      totalUsers: connectedUsers.size,
      users: Array.from(connectedUsers.values())
    });

    // Publish to other servers via Redis
    publishToRedis(config.channels.userPresence, {
      type: 'user_joined',
      user: user,
      server: config.server1.name
    });

    console.log(`✅ ${user.name} (${user.role}) joined from ${config.server1.name}`);
  });

  // Announcement from Lecturer
  socket.on('send_announcement', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user || user.role !== 'Lecturer') {
      socket.emit('error', 'Only lecturers can send announcements');
      return;
    }

    const announcement = {
      id: `${socket.id}_${Date.now()}`,
      type: 'announcement',
      sender: user,
      message: data.message,
      timestamp: new Date(),
      server: config.server1.name
    };

    // Broadcast to all clients on this server
    io.emit('new_message', announcement);

    // Publish to other servers via Redis
    publishToRedis(config.channels.announcements, announcement);

    console.log(`📢 Announcement from ${user.name}: ${data.message.substring(0, 50)}...`);
  });

  // Response from Student or Lecturer
  socket.on('send_response', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', 'User not found');
      return;
    }

    const response = {
      id: `${socket.id}_${Date.now()}`,
      type: 'response',
      sender: user,
      message: data.message,
      replyTo: data.replyTo,
      timestamp: new Date(),
      server: config.server1.name
    };

    // Broadcast to all clients on this server
    io.emit('new_response', response);

    // Publish to other servers via Redis
    publishToRedis(config.channels.responses, response);

    console.log(`💬 Response from ${user.name}: ${data.message.substring(0, 50)}...`);
  });

  // Request connected users list
  socket.on('request_users', () => {
    socket.emit('users_list', {
      users: Array.from(connectedUsers.values()),
      totalCount: connectedUsers.size,
      server: config.server1.name
    });
  });

  // Request server info
  socket.on('request_server_info', () => {
    socket.emit('server_info', {
      name: config.server1.name,
      port: config.server1.port,
      connectedUsers: connectedUsers.size,
      uptime: process.uptime(),
      redisConnected: redisPublisher && redisPublisher.isOpen
    });
  });

  // User disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      connectedUsers.delete(socket.id);

      // Broadcast user left to all clients
      io.emit('user_left', {
        user: user,
        totalUsers: connectedUsers.size,
        users: Array.from(connectedUsers.values())
      });

      // Publish to other servers via Redis
      publishToRedis(config.channels.userPresence, {
        type: 'user_left',
        user: user,
        server: config.server1.name
      });

      console.log(`👋 ${user.name} disconnected from ${config.server1.name}`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: config.server1.name,
    connectedUsers: connectedUsers.size,
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// API endpoint to get server stats
app.get('/api/stats', (req, res) => {
  res.json({
    server: config.server1.name,
    port: config.server1.port,
    connectedUsers: connectedUsers.size,
    users: Array.from(connectedUsers.values()),
    uptime: process.uptime(),
    redisConnected: redisPublisher && redisPublisher.isOpen,
    timestamp: new Date()
  });
});

// Serve client
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
const PORT = config.server1.port;

async function startServer() {
  try {
    // Initialize Redis
    await initializeRedis();

    // Start HTTP server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║         NexaTech Notification System                   ║
║              Server 1 (Primary)                        ║
╚════════════════════════════════════════════════════════╝
🚀 Server running on: http://localhost:${PORT}
📊 Stats available at: http://localhost:${PORT}/api/stats
❤️  Health check: http://localhost:${PORT}/health
🔴 Redis connected: ${redisPublisher && redisPublisher.isOpen ? 'Yes ✅' : 'No ⚠️'}
⏰ Started at: ${new Date().toLocaleString()}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
