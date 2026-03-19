const API_BASE = '/api/demo';

/**
 * Get available time slots for a specific date
 */
export async function getAvailableSlots(date, options = {}) {
  const {
    timezone = 'UTC',
    duration = 30
  } = options;

  const params = new URLSearchParams({
    date,
    timezone,
    duration: duration.toString()
  });

  try {
    const response = await fetch(`${API_BASE}/available-slots?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch available slots:', error);
    throw error;
  }
}

/**
 * Book a demo
 */
export async function bookDemo(bookingData) {
  try {
    const response = await fetch(`${API_BASE}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to book demo:', error);
    throw error;
  }
}

/**
 * Get all demo bookings (admin only)
 */
export async function getDemoBookings(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = '',
    date = '',
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(date && { date }),
    ...(search && { search }),
    sortBy,
    sortOrder
  });

  try {
    const response = await fetch(`${API_BASE}/admin/bookings?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch demo bookings:', error);
    throw error;
  }
}

/**
 * Get booking by ID (admin only)
 */
export async function getBookingById(id) {
  try {
    const response = await fetch(`${API_BASE}/admin/bookings/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    throw error;
  }
}

/**
 * Update booking status (admin only)
 */
export async function updateBookingStatus(id, statusData) {
  try {
    const response = await fetch(`${API_BASE}/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(statusData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to update booking status:', error);
    throw error;
  }
}

/**
 * Reschedule booking (admin only)
 */
export async function rescheduleBooking(id, rescheduleData) {
  try {
    const response = await fetch(`${API_BASE}/admin/bookings/${id}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(rescheduleData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to reschedule booking:', error);
    throw error;
  }
}

/**
 * Delete booking (admin only)
 */
export async function deleteBooking(id) {
  try {
    const response = await fetch(`${API_BASE}/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to delete booking:', error);
    throw error;
  }
}

/**
 * Get demo statistics (admin only)
 */
export async function getDemoStats() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch demo stats:', error);
    throw error;
  }
}
