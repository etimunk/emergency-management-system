import { useEffect, useState } from 'react';
import { getAllResources } from '../services/resourceApi';

export function useResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllResources();
      setResources(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('נכשלה טעינת המשאבים מהשרת.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshResources();
  }, []);

  return { resources, loading, error, refreshResources };
}

