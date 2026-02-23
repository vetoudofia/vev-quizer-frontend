// Format currency
export const formatCurrency = (amount) => {
  return '₦' + (amount || 0).toLocaleString();
};

// Format date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
};

// Get badge color
export const getBadgeColor = (badge) => {
  const colors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    grand_master: '#b22222',
    god: '#4b0082',
    genius: '#00ced1'
  };
  return colors[badge?.toLowerCase()] || '#667eea';
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    pending: '#FF9800',
    completed: '#4CAF50',
    failed: '#ff4757',
    approved: '#4CAF50',
    rejected: '#ff4757'
  };
  return colors[status?.toLowerCase()] || '#888';
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Set game state
export const setGameState = async (playing) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.IN_GAME, playing ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting game state:', error);
  }
};

// Check if in game
export const isInGame = async () => {
  try {
    const inGame = await AsyncStorage.getItem(STORAGE_KEYS.IN_GAME);
    return inGame === 'true';
  } catch (error) {
    return false;
  }
};