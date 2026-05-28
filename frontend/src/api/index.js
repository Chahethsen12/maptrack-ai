import axios from 'axios'

const api = axios.create({ baseURL: '' })  // Vite proxy handles /places and /ai

// ── Places ────────────────────────────────────────────────────────────────

export const getPlaces = (category) =>
  api.get('/places/', { params: category ? { category } : {} }).then(r => r.data)

export const createPlace = (data) =>
  api.post('/places/', data).then(r => r.data)

export const updatePlace = (id, data) =>
  api.put(`/places/${id}`, data).then(r => r.data)

export const deletePlace = (id) =>
  api.delete(`/places/${id}`)

// ── Routes ────────────────────────────────────────────────────────────────

export const getRoutes = () =>
  api.get('/routes/').then(r => r.data)

export const createRoute = (data) =>
  api.post('/routes/', data).then(r => r.data)

export const deleteRoute = (id) =>
  api.delete(`/routes/${id}`)

export const fetchOSRMRoute = async (waypoints) => {
  // waypoints: [{lat, lng}, ...]
  if (waypoints.length < 2) return null;
  const coords = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await axios.get(url);
  return res.data;
}

// ── AI ────────────────────────────────────────────────────────────────────

export const aiCategorize = (title, note) =>
  api.post('/ai/categorize', { title, note }).then(r => r.data)

export const aiSummarize = (placeIds) =>
  api.post('/ai/summarize', placeIds ? { place_ids: placeIds } : {}).then(r => r.data)
