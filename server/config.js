// Configuration file for the notification system
module.exports = {
  // Server 1 Configuration
  server1: {
    port: 3000,
    host: 'localhost',
    name: 'Server 1 (Primary)'
  },

  // Server 2 Configuration
  server2: {
    port: 3001,
    host: 'localhost',
    name: 'Server 2 (Secondary)'
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    // If using Docker, change host to 'redis' (service name in docker-compose)
    // host: 'redis',
    retryStrategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        return new Error('Redis connection refused');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Redis retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  },

  // Socket.IO Configuration
  socketIO: {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  },

  // Redis Pub/Sub Channels
  channels: {
    announcements: 'announcements',
    responses: 'responses',
    userPresence: 'user_presence',
    broadcast: 'broadcast'
  },

  // Message Types
  messageTypes: {
    ANNOUNCEMENT: 'announcement',
    RESPONSE: 'response',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    SERVER_INFO: 'server_info'
  }
};
