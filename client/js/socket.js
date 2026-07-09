/**
 * NexaTech Notification System - WebSocket Connection Handler
 * 
 * Manages:
 * - Socket.IO connection and reconnection logic
 * - Event listeners for server communication
 * - Automatic failover to backup server
 * - Connection state management
 */

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentServer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.servers = [
      { url: 'http://localhost:3000', name: 'Server 1 (Primary)', port: 3000 },
      { url: 'http://localhost:3001', name: 'Server 2 (Secondary)', port: 3001 }
    ];
    this.currentServerIndex = 0;
  }

  /**
   * Connect to the notification system
   */
  connect(onConnected, onError) {
    const server = this.servers[this.currentServerIndex];
    
    console.log(`🔗 Attempting to connect to ${server.name}...`);

    this.socket = io(server.url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling']
    });

    // Connection successful
    this.socket.on('connect', () => {
      console.log(`✅ Connected to ${server.name}`);
      this.isConnected = true;
      this.currentServer = server;
      this.reconnectAttempts = 0;
      
      if (onConnected) {
        onConnected(server);
      }
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error(`❌ Connection error to ${server.name}:`, error);
      this.handleConnectionError(onConnected, onError);
    });

    // Disconnect
    this.socket.on('disconnect', (reason) => {
      console.log(`👋 Disconnected from ${server.name}. Reason:`, reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try another
        this.attemptFailover(onConnected, onError);
      }
    });

    // Server reconnection attempt
    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
    });

    // Error from server
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (onError) {
        onError(error);
      }
    });
  }

  /**
   * Handle connection errors and attempt failover
   */
  handleConnectionError(onConnected, onError) {
    if (this.reconnectAttempts < 3) {
      this.reconnectAttempts++;
      console.log(`🔄 Retry ${this.reconnectAttempts}/3 on same server...`);
      return;
    }

    console.log(`⚠️  Server ${this.currentServerIndex + 1} failed. Attempting failover...`);
    this.attemptFailover(onConnected, onError);
  }

  /**
   * Attempt to connect to backup server
   */
  attemptFailover(onConnected, onError) {
    // Switch to backup server
    this.currentServerIndex = this.currentServerIndex === 0 ? 1 : 0;
    this.reconnectAttempts = 0;

    console.log(`🔀 Failing over to Server ${this.currentServerIndex + 1}`);

    // Close current connection
    if (this.socket) {
      this.socket.disconnect();
    }

    // Try to connect to backup server
    setTimeout(() => {
      this.connect(onConnected, onError);
    }, 1000);
  }

  /**
   * Emit user join event
   */
  joinUser(userData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('user_join', userData);
    }
  }

  /**
   * Emit announcement
   */
  sendAnnouncement(message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_announcement', { message });
    }
  }

  /**
   * Emit response
   */
  sendResponse(message, replyTo = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_response', { message, replyTo });
    }
  }

  /**
   * Request list of connected users
   */
  requestUsers() {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_users');
    }
  }

  /**
   * Request server info
   */
  requestServerInfo() {
    if (this.socket && this.isConnected) {
      this.socket.emit('request_server_info');
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from server');
    }
  }

  /**
   * Get current server information
   */
  getCurrentServer() {
    return this.currentServer;
  }

  /**
   * Check if connected
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Export for use in app.js
const socketManager = new SocketManager();
