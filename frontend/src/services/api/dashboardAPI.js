import api from '../../services/api'

export const dashboardAPI = {
  getStats: async (timeFilter = 'week') => {
    const response = await api.get(`/dashboard/stats?timeFilter=${timeFilter}`)
    return response.data
  },
  
  resetDatabase: async () => {
    const response = await api.post('/dashboard/reset-database')
    return response.data
  }
}