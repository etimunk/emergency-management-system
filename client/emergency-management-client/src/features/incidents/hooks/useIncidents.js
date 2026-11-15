// src/features/incidents/hooks/useIncidents.js
import { useState, useEffect } from 'react';
import { getAllIncidents, updateIncidentStatus } from '../services/incidentApi';

export function useIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. פונקציה פנימית לשליפת האירועים (נקראת בטעינה וניתן להפעיל אותה שוב לרענון)
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError('נכשלה טעינת נתוני האירועים מהחפ"ק. ודא שהשרת פעיל.');
    } finally {
      setLoading(false);
    }
  };

  // שליפת הנתונים בפעם הראשונה שהרכיב עולה למסך
  useEffect(() => {
    fetchIncidents();
  }, []);

  // 2. פונקציית עזר לשינוי סטטוס של אירוע ישירות מהממשק
  const changeStatus = async (id, newStatus) => {
    try {
      const updatedIncident = await updateIncidentStatus(id, newStatus);
      // עדכון הסטייט המקומי כדי שהמסך יתרענן מיד ללא צורך בקריאת שרת נוספת
      setIncidents((prev) =>
        (Array.isArray(prev) ? prev : []).map((inc) =>
          inc.id === id ? updatedIncident : inc
        )
      );
      return updatedIncident;
    } catch (err) {
      console.error("Failed to update status:", err);
      alert('עדכון הסטטיס נכשל במערכת.');
      throw err;
    }
  };

  // אנחנו מחזירים את המשתנים והפונקציות כדי שהקומפוננטות (ה-UI) יוכלו להשתמש בהם
  return { 
    incidents, 
    loading, 
    error, 
    refreshIncidents: fetchIncidents, 
    changeStatus 
  };
}