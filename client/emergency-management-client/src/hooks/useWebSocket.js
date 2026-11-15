import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Hook לניהול חיבור WebSocket עם STOMP
 * מתחבר לשרת Spring Boot ומאפשר שליחה/קבלה של הודעות בזמן אמת
 */
export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const clientRef = useRef(null);

  const connect = (token = null) => {
    const url = token
      ? `http://localhost:8082/ws-connect?token=${token}`
      : 'http://localhost:8082/ws-connect';

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000, // ניסיון התחברות מחדש כל 5 שניות
      debug: (str) => console.log('[STOMP]', str),

      onConnect: () => {
        console.log('[WebSocket] Connected to server');
        setConnected(true);

        // הרשמה לערוץ העדכונים
        client.subscribe('/topic/updates', (message) => {
          try {
            const body = JSON.parse(message.body);
            setMessages((prev) => [...prev, body]);
          } catch (e) {
            console.error('[WebSocket] Failed to parse message', e);
          }
        });
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame);
      },
    });

    client.activate();
    clientRef.current = client;
  };

  /**
   * שולח הודעה לשרת
   * @param {string} type - סוג ההודעה (למשל: RESOURCE_MOVED, AGENT_DECISION)
   * @param {object} payload - התוכן של ההודעה
   */
  const sendMessage = (type, payload) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: '/app/message',
        body: JSON.stringify({
          type,
          payload,
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  };

  // התחברות אוטומטית בטעינה (עם טוקן אם קיים)
  useEffect(() => {
    const token = localStorage.getItem('token');
    connect(token);

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  return {
    connected,
    messages,
    sendMessage,
  };
}