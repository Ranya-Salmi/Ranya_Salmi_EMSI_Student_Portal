"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api, type Alerte } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function getWebSocketUrl(token: string) {
  const wsBase = API_URL.replace(/^http/, "ws");
  return `${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`;
}

function notifyAlert(alert: Alerte) {
  const description = alert.message;

  if (alert.urgence === "critical") {
    toast.error(alert.titre, { description });
    return;
  }

  if (alert.urgence === "warning") {
    toast.warning(alert.titre, { description });
    return;
  }

  toast(alert.titre, { description });
}

export function RealtimeNotifications() {
  const socketRef = useRef<WebSocket | null>(null);
  const seenAlertIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const token = api.getToken();

    if (!token) return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let shouldReconnect = true;

    const connect = () => {
      const socket = new WebSocket(getWebSocketUrl(token));
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("[WS] Notifications connected");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "connected") {
            console.log("[WS]", payload.message);
            return;
          }

          if (payload.type === "error") {
            console.warn("[WS]", payload.message);
            return;
          }

          if (payload.type === "alerts") {
            const alerts: Alerte[] = payload.alerts || [];

            window.dispatchEvent(
              new CustomEvent("emsi:alerts-updated", {
                detail: {
                  unread_count: payload.unread_count,
                  alerts,
                },
              })
            );

            for (const alert of alerts) {
              if (seenAlertIds.current.has(alert.id)) continue;

              seenAlertIds.current.add(alert.id);
              notifyAlert(alert);
            }
          }
        } catch (error) {
          console.error("[WS] Invalid message", error);
        }
      };

      socket.onerror = () => {
        console.warn("[WS] Notification socket error");
      };

      socket.onclose = () => {
        console.log("[WS] Notifications disconnected");

        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return null;
}