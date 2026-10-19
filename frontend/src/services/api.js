// API Service Client
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://vyom-ira-backend.onrender.com";
  }
  return "http://localhost:5000";
};

const API_BASE = getApiBase().replace(/\/+$/, "");

const getHeaders = (includeAuth = true) => {
  const headers = { "Content-Type": "application/json" };
  if (includeAuth) {
    const token = localStorage.getItem("airline_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // Auth APIs
  auth: {
    login: (credentials) =>
      fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify(credentials)
      }).then(handleResponse),

    register: (userData) =>
      fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify(userData)
      }).then(handleResponse),

    me: () =>
      fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(true)
      }).then(handleResponse)
  },

  // Flight APIs
  flights: {
    getAll: () =>
      fetch(`${API_BASE}/flights`, {
        headers: getHeaders(false)
      }).then(handleResponse),

    getById: (id) =>
      fetch(`${API_BASE}/flights/${id}`, {
        headers: getHeaders(false)
      }).then(handleResponse),

    create: (flightData) =>
      fetch(`${API_BASE}/flights`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(flightData)
      }).then(handleResponse),

    update: (id, flightData) =>
      fetch(`${API_BASE}/flights/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(flightData)
      }).then(handleResponse),

    delete: (id) =>
      fetch(`${API_BASE}/flights/${id}`, {
        method: "DELETE",
        headers: getHeaders(true)
      }).then(handleResponse),

    getBookings: (flightId) =>
      fetch(`${API_BASE}/flights/${flightId}/bookings`, {
        headers: getHeaders(false)
      }).then(handleResponse)
  },

  // Passenger CRUD APIs
  passengers: {
    getAll: () =>
      fetch(`${API_BASE}/passengers`, {
        headers: getHeaders(false)
      }).then(handleResponse),

    getById: (id) =>
      fetch(`${API_BASE}/passengers/${id}`, {
        headers: getHeaders(false)
      }).then(handleResponse),

    create: (passengerData) =>
      fetch(`${API_BASE}/passengers`, {
        method: "POST",
        headers: getHeaders(false),
        body: JSON.stringify(passengerData)
      }).then(handleResponse),

    update: (id, passengerData) =>
      fetch(`${API_BASE}/passengers/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(passengerData)
      }).then(handleResponse),

    delete: (id) =>
      fetch(`${API_BASE}/passengers/${id}`, {
        method: "DELETE",
        headers: getHeaders(true)
      }).then(handleResponse)
  },

  // Booking APIs
  bookings: {
    create: (bookingData) =>
      fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(bookingData)
      }).then(handleResponse),

    getAll: (params = "") =>
      fetch(`${API_BASE}/bookings${params ? `?${params}` : ""}`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    getById: (id) =>
      fetch(`${API_BASE}/bookings/${id}`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    updateStatus: (id, status) =>
      fetch(`${API_BASE}/bookings/${id}/status`, {
        method: "PATCH",
        headers: getHeaders(true),
        body: JSON.stringify({ status })
      }).then(handleResponse)
  },

  // Passenger Portal specific
  passenger: {
    getMyBookings: () =>
      fetch(`${API_BASE}/api/passenger/my-bookings`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    cancelBooking: (id) =>
      fetch(`${API_BASE}/api/passenger/my-bookings/${id}/cancel`, {
        method: "PATCH",
        headers: getHeaders(true)
      }).then(handleResponse)
  },

  // Admin Portal specific
  admin: {
    getStats: () =>
      fetch(`${API_BASE}/api/admin/stats`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    getUsers: () =>
      fetch(`${API_BASE}/api/admin/users`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    createUser: (userData) =>
      fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(userData)
      }).then(handleResponse),

    deleteUser: (id) =>
      fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: getHeaders(true)
      }).then(handleResponse),

    getNotifications: (limit = 50) =>
      fetch(`${API_BASE}/api/admin/notifications?limit=${limit}`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    markNotificationRead: (id) =>
      fetch(`${API_BASE}/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        headers: getHeaders(true)
      }).then(handleResponse),

    markAllNotificationsRead: () =>
      fetch(`${API_BASE}/api/admin/notifications/mark-all-read`, {
        method: "PATCH",
        headers: getHeaders(true)
      }).then(handleResponse)
  },

  // Staff Portal specific
  staff: {
    getFlights: () =>
      fetch(`${API_BASE}/api/staff/flights`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    getManifest: (flightId) =>
      fetch(`${API_BASE}/api/staff/flights/${flightId}/manifest`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    getAssistanceList: () =>
      fetch(`${API_BASE}/api/staff/assistance`, {
        headers: getHeaders(true)
      }).then(handleResponse),

    getFoodServiceList: () =>
      fetch(`${API_BASE}/api/staff/food-service`, {
        headers: getHeaders(true)
      }).then(handleResponse)
  },

  // Check-In and Boarding specific
  checkin: {
    lookup: (ticketNumber, flightId) => {
      let query = `ticketNumber=${ticketNumber}`;
      if (flightId) query += `&flightId=${flightId}`;
      return fetch(`${API_BASE}/api/checkin/lookup?${query}`, {
        headers: getHeaders(false)
      }).then(handleResponse);
    },

    boardPassenger: (id) =>
      fetch(`${API_BASE}/api/checkin/bookings/${id}/board`, {
        method: "PATCH",
        headers: getHeaders(true)
      }).then(handleResponse)
  }
};
