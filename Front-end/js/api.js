// js/api.js — Shared API layer for TalentLaunch Rwanda frontend

// Dynamically determine API base URL
const API_BASE = (() => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // For Codespaces: use same hostname with /api proxy
  if (hostname.includes('.app.github.dev')) {
    const port = window.location.port;
    const baseUrl = port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    const api = `${baseUrl}/api`;
    console.log('[API] Codespaces API_BASE:', api);
    return api;
  }

  // For local development or docker environment
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    if (window.location.port === '5000') {
      console.log('[API] Local API_BASE:', '/api');
      return '/api';
    }

    const localBase = `${protocol}//${hostname}:5000/api`;
    console.log('[API] Local API_BASE:', localBase);
    return localBase;
  }

  // Fallback to backend location
  const fallback = `${protocol}//${hostname}:5000/api`;
  console.log('[API] Fallback API_BASE:', fallback);
  return fallback;
})();

console.log('[API] API_BASE:', API_BASE);

// ─────────────────────────────────────────
//  UTILITY FUNCTIONS
// ─────────────────────────────────────────

// Get stored JWT token
function getToken() {
  return localStorage.getItem('token');
}

// Set JWT token
function setToken(token) {
  localStorage.setItem('token', token);
}

// Remove JWT token (logout)
function removeToken() {
  localStorage.removeItem('token');
}

// Check if user is logged in
function isLoggedIn() {
  return !!getToken();
}

// Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const isMultipart = options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    headers,
    ...options,
  };

  // Add auth header if token exists
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    // Handle unauthorized (token expired)
    if (response.status === 401) {
      removeToken();
      window.location.href = 'login.html';
      throw new Error('401 Session expired. Please log in again.');
    }

    if (!response.ok) {
      const message = data && data.message ? data.message : 'API request failed';
      const error = new Error(`${response.status} ${message}`);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', url, config, error);
    throw error;
  }
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href]');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (href && href.includes('login.html?logout=1')) {
    event.preventDefault();
    removeToken();
    window.location.href = 'login.html?logout=1';
  }
});

// ─────────────────────────────────────────
//  AUTH API
// ─────────────────────────────────────────

async function register(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

async function login(credentials) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (data.token) {
    setToken(data.token);
  }

  return data;
}

async function getMe() {
  return apiRequest('/auth/me');
}

async function logout() {
  removeToken();
  window.location.href = 'login.html?logout=1';
}

async function updateProfile(profileData, avatarFile) {
  const formData = new FormData();
  Object.keys(profileData).forEach(key => {
    if (profileData[key] !== undefined && profileData[key] !== null) {
      formData.append(key, profileData[key]);
    }
  });
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  return apiRequest('/auth/me', {
    method: 'PUT',
    headers: {},
    body: formData,
  });
}

// ─────────────────────────────────────────
//  ADMIN API
// ─────────────────────────────────────────

async function createAdmin(adminData) {
  return apiRequest('/auth/admin', {
    method: 'POST',
    body: JSON.stringify(adminData),
  });
}

// ─────────────────────────────────────────
//  MENTORS API
// ─────────────────────────────────────────

async function getMentors() {
  return apiRequest('/mentors');
}

async function getMentor(id) {
  return apiRequest(`/mentors/${id}`);
}

async function createMentor(mentorData, avatarFile) {
  const formData = new FormData();
  Object.keys(mentorData).forEach(key => {
    formData.append(key, mentorData[key]);
  });
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  return apiRequest('/mentors', {
    method: 'POST',
    headers: {}, // Let browser set content-type for FormData
    body: formData,
  });
}

async function updateMentor(id, mentorData, avatarFile) {
  const formData = new FormData();
  Object.keys(mentorData).forEach(key => {
    formData.append(key, mentorData[key]);
  });
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  return apiRequest(`/mentors/${id}`, {
    method: 'PUT',
    headers: {},
    body: formData,
  });
}

async function deleteMentor(id) {
  return apiRequest(`/mentors/${id}`, {
    method: 'DELETE',
  });
}

// ─────────────────────────────────────────
//  WORKSHOPS API
// ─────────────────────────────────────────

async function getMyWorkshops() {
  return apiRequest('/workshops/my');
}

async function getWorkshop(id) {
  return apiRequest(`/workshops/${id}`);
}

async function createWorkshop(workshopData) {
  return apiRequest('/workshops', {
    method: 'POST',
    body: JSON.stringify(workshopData),
  });
}

async function updateWorkshop(id, workshopData) {
  return apiRequest(`/workshops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(workshopData),
  });
}

async function deleteWorkshop(id) {
  return apiRequest(`/workshops/${id}`, {
    method: 'DELETE',
  });
}

async function enrollInWorkshop(id) {
  return apiRequest(`/workshops/${id}/enroll`, {
    method: 'POST',
  });
}

async function unenrollFromWorkshop(id) {
  return apiRequest(`/workshops/${id}/enroll`, {
    method: 'DELETE',
  });
}

// ─────────────────────────────────────────
//  TALENTS API
// ─────────────────────────────────────────

async function getTalents() {
  return apiRequest('/talents');
}

async function getTalent(id) {
  return apiRequest(`/talents/${id}`);
}

async function createTalent(talentData, file) {
  if (file) {
    const formData = new FormData();
    Object.keys(talentData).forEach(key => {
      formData.append(key, talentData[key]);
    });
    formData.append('file', file);

    return apiRequest('/talents', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  return apiRequest('/talents', {
    method: 'POST',
    body: JSON.stringify(talentData),
  });
}

async function updateTalent(id, talentData) {
  return apiRequest(`/talents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(talentData),
  });
}

async function deleteTalent(id) {
  return apiRequest(`/talents/${id}`, {
    method: 'DELETE',
  });
}

// ─────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────

async function healthCheck() {
  return apiRequest('/health');
}

// ─────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────

function ensureApiReady(callback) {
  if (typeof callback !== 'function') return;

  const run = () => {
    if (window.API) {
      return callback();
    }
    setTimeout(run, 50);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    run();
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }
}

window.ensureApiReady = ensureApiReady;

window.API = {
  // Auth
  register,
  login,
  getMe,
  updateProfile,
  logout,
  isLoggedIn,

  // Mentors
  getMentors,
  getMentor,
  createMentor,
  updateMentor,
  deleteMentor,

  // Workshops
  getWorkshops,
  getWorkshop,
  getMyWorkshops,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  enrollInWorkshop,
  unenrollFromWorkshop,

  // Talents
  getTalents,
  getTalent,
  createTalent,
  updateTalent,
  deleteTalent,

  // Utils
  healthCheck,

  // Token utilities
  setToken,
};