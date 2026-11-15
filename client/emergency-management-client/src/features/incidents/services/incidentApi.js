// src/features/incidents/services/incidentApi.js
import api from '../../../services/api';

/**
 * 1. קבלת כל האירועים מהשרת
 * נתיב בשרת: GET /api/incidents
 */
export const getAllIncidents = async () => {
  const response = await api.get('/incidents');
  const data = response.data;
  return Array.isArray(data) ? data : [];
};

export const getIncidentById = async (id) => {
  const response = await api.get(`/incidents/${id}`);
  return response.data;
};

/**
 * 2. יצירת אירוע חירום חדש בשטח
 * נתיב בשרת: POST /api/incidents
 */
export const createIncident = async (incidentData) => {
  const response = await api.post('/incidents', incidentData);
  return response.data;
};

/**
 * 3. עדכון סטטוס אירוע (למשל: ACTIVE, RESOLVED וכדומה)
 * נתיב בשרת: PATCH /api/incidents/{id}/status?status=...
 * שים לב: הפרמטר מועבר כ-params מכיוון שבשרת הגדרת @RequestParam
 */
export const updateIncidentStatus = async (id, status) => {
  const response = await api.patch(`/incidents/${id}/status`, null, {
    params: { status }
  });
  return response.data;
};

/**
 * 4. עדכון תיאור אירוע מהשטח
 * נתיב בשרת: PATCH /api/incidents/{id}/description?description=...
 */
export const updateIncidentDescription = async (id, description) => {
  const response = await api.patch(`/incidents/${id}/description`, null, {
    params: { description }
  });
  return response.data;
};

/**
 * 5. חיפוש אירועים על פי טווח זמנים
 * נתיב בשרת: GET /api/incidents/search/by-time?start=...&end=...
 */
export const getIncidentsByTime = async (startTime, endTime) => {
  const response = await api.get('/incidents/search/by-time', {
    params: { start: startTime, end: endTime }
  });
  return response.data;
};

/**
 * 6. חיפוש אירועים לפי כתובת / מיקום
 * נתיב בשרת: GET /api/incidents/search/by-location?address=...
 */
export const getIncidentsByLocation = async (address) => {
  const response = await api.get('/incidents/search/by-location', {
    params: { address }
  });
  return response.data;
};

/**
 * 7. שיוך משאב (אמבולנס/צוות) לאירוע
 * נתיב בשרת: POST /api/incidents/{id}/resources/{resourceId}
 */
export const addResourceToIncident = async (incidentId, resourceId) => {
  const response = await api.post(`/incidents/${incidentId}/resources/${resourceId}`);
  return response.data;
};

/**
 * 8. הוספת פצוע/נפגע לאירוע
 * נתיב בשרת: POST /api/incidents/{id}/casualties/{casualtyId}
 */
export const addCasualtyToIncident = async (incidentId, casualtyId) => {
  const response = await api.post(`/incidents/${incidentId}/casualties/${casualtyId}`);
  return response.data;
};

/**
 * 9. הוספת יומן פעילות (ActionLog) לאירוע
 * נתיב בשרת: POST /api/incidents/{id}/logs/{logId}
 */
export const addLogToIncident = async (incidentId, logId) => {
  const response = await api.post(`/incidents/${incidentId}/logs/${logId}`);
  return response.data;
};

/**
 * 10. הסרת משאב מאירוע (למשל כשאמבולנס מסיים משימה וחוזר לזמינות)
 * נתיב בשרת: DELETE /api/incidents/{id}/resources/{resourceId}
 */
export const removeResourceFromIncident = async (incidentId, resourceId) => {
  const response = await api.delete(`/incidents/${incidentId}/resources/${resourceId}`);
  return response.data;
};