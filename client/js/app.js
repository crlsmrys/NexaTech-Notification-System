/**
 * NexaTech Notification System - Main Application Logic
 * 
 * Handles:
 * - User interface management
 * - Form validation
 * - Message display and formatting
 * - Event handlers
 * - Real-time UI updates
 */

class NotificationApp {
  constructor() {
    this.currentUser = null;
    this.messageHistory = [];
    this.connectedUsers = [];
    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    // Login elements
    this.loginSection = document.getElementById('loginSection');
    this.chatSection = document.getElementById('chatSection');
    this.usernameInput = document.getElementById('username');
    this.roleSelect = document.getElementById('role');
    this.connectBtn = document.getElementById('connectBtn');
    this.connectionStatus = document.getElementById('connectionStatus');

    // Chat elements
    this.messagesContainer = document.getElementById('messagesContainer');
    this.usersList = document.getElementById('usersList');
    this.usersCount = document.getElementById('usersCount');
    this.displayName = document.getElementById('displayName');
    this.userRole = document.getElementById('userRole');
    this.joinedTime = document.getElementById('joinedTime');
    this.serverName = document.getElementById('serverName');
    this.serverPort = document.getElementById('serverPort');

    // Input panels
    this.lecturerPanel = document.getElementById('lecturerPanel');
    this.responsePanel = document.getElementById('responsePanel');
    this.announcementInput = document.getElementById('announcementInput');
    this.responseInput = document.getElementById('responseInput');
    this.charCount = document.getElementById('charCount');
    this.responseCharCount = document.getElementById('responseCharCount');

    // Buttons
    this.sendAnnouncementBtn = document.getElementById('sendAnnouncementBtn');
    this.sendResponseBtn = document.getElementById('sendResponseBtn');
    this.disconnectBtn = document.getElementById('disconnectBtn');

    // Error elements
    this.usernameError = document.getElementById('usernameError');
    this.roleError = document.getElementById('roleError');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.connectBtn.addEventListener('click', () => this.handleConnect());
    this.disconnectBtn.addEventListener('click', () => this.handleDisconnect());
    this.sendAnnouncementBtn.addEventListener('click', () => this.handleSendAnnouncement());
    this.sendResponseBtn.addEventListener('click', () => this.handleSendResponse());

    // Character count for announcement
    this.announcementInput.addEventListener('input', (e) => {
      this.charCount.textContent = `${e.target.value.length}/500`;
    });

    // Character count for response
    this.responseInput.addEventListener('input', (e) => {
      this.responseCharCount.textContent = `${e.target.value.length}/300`;
    });

    // Enter key to send
    this.announcementInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') this.handleSendAnnouncement();
    });

    this.responseInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') this.handleSendResponse();
    });

    // Allow Enter in inputs (not Shift+Enter)
    this.usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleConnect();
    });
  }

  /**
   * Validate login form
   */
  validateForm() {
    let isValid = true;
    this.usernameError.textContent = '';
    this.roleError.textContent = '';

    if (!this.usernameInput.value.trim()) {
      this.usernameError.textContent = '❌ Please enter your name';
      isValid = false;
    }

    if (!this.roleSelect.value) {
      this.roleError.textContent = '❌ Please select a role';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Handle user connection
   */
  handleConnect() {
    if (!this.validateForm()) return;

    const userData = {
      name: this.usernameInput.value.trim(),
      role: this.roleSelect.value
    };

    this.currentUser = userData;
    this.updateConnectionStatus(false, 'Connecting...');

    // Connect to WebSocket
    socketManager.connect(
      (server) => this.onConnectSuccess(server),
      (error) => this.onConnectError(error)
    );

    // Join the system
    socketManager.joinUser(userData);
  }

  /**
   * Handle successful connection
   */
  onConnectSuccess(server) {
    console.log('✅ Connected successfully');

    // Update UI
    this.loginSection.style.display = 'none';
    this.chatSection.style.display = 'flex';

    // Update user display
    this.displayName.textContent = this.currentUser.name;
    this.userRole.textContent = `${this.currentUser.role === 'Lecturer' ? '👨‍🏫' : '👨‍🎓'} ${this.currentUser.role}`;
    this.joinedTime.textContent = `Joined: ${new Date().toLocaleTimeString()}`;

    // Update server display
    this.serverName.textContent = server.name;
    this.serverPort.textContent = `Port: ${server.port}`;
    this.updateConnectionStatus(true, `Connected to ${server.name}`);

    // Show appropriate input panel
    if (this.currentUser.role === 'Lecturer') {
      this.lecturerPanel.style.display = 'flex';
      this.responsePanel.style.display = 'flex';
    } else {
      this.lecturerPanel.style.display = 'none';
      this.responsePanel.style.display = 'flex';
    }

    // Setup socket event listeners
    this.setupSocketListeners();

    // Request users list
    socketManager.requestUsers();
    socketManager.requestServerInfo();
  }

  /**
   * Handle connection error
   */
  onConnectError(error) {
    console.error('Connection failed:', error);
    this.updateConnectionStatus(false, 'Connection failed');
    this.usernameError.textContent = '❌ Failed to connect. Please check if servers are running.';
  }

  /**
   * Setup Socket.IO event listeners
   */
  setupSocketListeners() {
    // New message
    socketManager.on('new_message', (message) => {
      this.displayMessage(message);
    });

    // New response
    socketManager.on('new_response', (response) => {
      this.displayMessage(response);
    });

    // User joined
    socketManager.on('user_joined', (data) => {
      this.updateUsersList(data.users);
      this.showSystemMessage(`👋 ${data.user.name} joined (${data.user.role})`);
    });

    // User left
    socketManager.on('user_left', (data) => {
      this.updateUsersList(data.users);
      this.showSystemMessage(`👋 ${data.user.name} left`);
    });

    // Users list update
    socketManager.on('users_list', (data) => {
      this.updateUsersList(data.users);
    });

    // Server info
    socketManager.on('server_info', (data) => {
      this.serverName.textContent = data.name;
      this.serverPort.textContent = `Port: ${data.port}`;
    });

    // User presence update from other servers
    socketManager.on('user_presence_update', (data) => {
      if (data.type === 'user_joined') {
        this.showSystemMessage(`👋 ${data.user.name} joined from ${data.server} (${data.user.role})`);
      } else if (data.type === 'user_left') {
        this.showSystemMessage(`👋 ${data.user.name} left from ${data.server}`);
      }
    });

    // Errors
    socketManager.on('error', (error) => {
      console.error('Socket error:', error);
      this.showSystemMessage(`❌ Error: ${error}`);
    });
  }

  /**
   * Handle send announcement
   */
  handleSendAnnouncement() {
    const message = this.announcementInput.value.trim();

    if (!message) {
      alert('Please type an announcement');
      return;
    }

    socketManager.sendAnnouncement(message);
    this.announcementInput.value = '';
    this.charCount.textContent = '0/500';
  }

  /**
   * Handle send response
   */
  handleSendResponse() {
    const message = this.responseInput.value.trim();

    if (!message) {
      alert('Please type a response');
      return;
    }

    socketManager.sendResponse(message);
    this.responseInput.value = '';
    this.responseCharCount.textContent = '0/300';
  }

  /**
   * Display message in chat
   */
  displayMessage(message) {
    this.messageHistory.push(message);

    const messageEl = document.createElement('div');
    messageEl.className = 'message';

    const time = new Date(message.timestamp).toLocaleTimeString();
    const roleClass = message.sender.role === 'Lecturer' ? 'lecturer' : 'student';
    const roleEmoji = message.sender.role === 'Lecturer' ? '👨‍🏫' : '👨‍🎓';
    const messageType = message.type === 'announcement' ? 'announcement' : 'response';

    messageEl.innerHTML = `
      <div class="message-wrapper">
        <div class="message-avatar">${message.sender.name.charAt(0).toUpperCase()}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">${message.sender.name}</span>
            <span class="message-role ${roleClass}">${roleEmoji} ${message.sender.role}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-text ${messageType}">
            ${this.escapeHtml(message.message)}
          </div>
          <div class="message-server">
            <small>📡 ${message.server}</small>
          </div>
        </div>
      </div>
    `;

    // Remove placeholder if exists
    const placeholder = this.messagesContainer.querySelector('.message-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Display system message
   */
  showSystemMessage(text) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      text-align: center;
      color: #6c757d;
      padding: 10px;
      font-size: 0.9rem;
      margin: 10px 0;
      background: #f8f9fa;
      border-radius: 5px;
    `;
    messageEl.textContent = text;

    // Remove placeholder if exists
    const placeholder = this.messagesContainer.querySelector('.message-placeholder');
    if (placeholder) {
      placeholder.remove();
    }

    this.messagesContainer.appendChild(messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * Update users list
   */
  updateUsersList(users) {
    this.connectedUsers = users;
    this.usersCount.textContent = users.length;

    this.usersList.innerHTML = '';

    if (users.length === 0) {
      this.usersList.innerHTML = '<li class="no-users">No users online</li>';
      return;
    }

    users.forEach(user => {
      const li = document.createElement('li');
      const roleEmoji = user.role === 'Lecturer' ? '👨‍🏫' : '👨‍🎓';
      li.innerHTML = `${roleEmoji} ${user.name} <small style="color: #999;">(${user.role})</small>`;
      this.usersList.appendChild(li);
    });
  }

  /**
   * Update connection status
   */
  updateConnectionStatus(connected, text) {
    const dot = this.connectionStatus.querySelector('.status-dot');
    const span = this.connectionStatus.querySelector('span:last-child');

    if (connected) {
      dot.className = 'status-dot connected';
      span.textContent = `Connected ✅`;
      span.style.color = '#28a745';
    } else {
      dot.className = 'status-dot disconnected';
      span.textContent = text || 'Disconnected';
      span.style.color = '#dc3545';
    }
  }

  /**
   * Handle disconnect
   */
  handleDisconnect() {
    if (confirm('Are you sure you want to disconnect?')) {
      socketManager.disconnect();
      this.resetUI();
    }
  }

  /**
   * Reset UI to login state
   */
  resetUI() {
    this.loginSection.style.display = 'block';
    this.chatSection.style.display = 'none';
    this.messagesContainer.innerHTML = '<div class="message-placeholder"><p>📭 No messages yet</p></div>';
    this.usersList.innerHTML = '<li class="no-users">No users online</li>';
    this.usernameInput.value = '';
    this.roleSelect.value = '';
    this.announcementInput.value = '';
    this.responseInput.value = '';
    this.charCount.textContent = '0/500';
    this.responseCharCount.textContent = '0/300';
    this.updateConnectionStatus(false, 'Not connected');
    this.currentUser = null;
    this.messageHistory = [];
    this.connectedUsers = [];
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 NexaTech Notification System loaded');
  window.app = new NotificationApp();
});
