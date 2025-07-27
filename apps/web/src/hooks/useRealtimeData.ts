"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert, EventCluster } from "@/types/civic";

interface UseRealtimeDataOptions {
  region?: string;
  coordinates?: { latitude: number; longitude: number };
  autoConnect?: boolean;
}

export function useRealtimeData(options: UseRealtimeDataOptions = {}) {
  const {
    region = "bangalore-central",
    coordinates,
    autoConnect = true,
  } = options;

  const unsubscribersRef = useRef<Unsubscribe[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [clusters, setClusters] = useState<EventCluster[]>([]);

  const connect = useCallback(() => {
    if (unsubscribersRef.current.length > 0) return; // Already connected

    try {
      const unsubscribers: Unsubscribe[] = [];

      // Real-time alerts listener
      const alertsQuery = query(
        collection(db, "alerts"),
        where("region", "==", region),
        orderBy("timestamp", "desc"),
        limit(50),
      );

      const alertsUnsubscribe = onSnapshot(
        alertsQuery,
        (snapshot) => {
          const newAlerts: Alert[] = [];
          snapshot.docChanges().forEach((change) => {
            const alert = { id: change.doc.id, ...change.doc.data() } as Alert;

            if (change.type === "added") {
              newAlerts.push(alert);
              // Trigger notification for new alerts
              console.log("New alert received:", alert);
            }
          });

          if (newAlerts.length > 0) {
            setAlerts((prev) => [...newAlerts, ...prev]);
          }

          // Update full alerts list
          const allAlerts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Alert[];
          setAlerts(allAlerts);
        },
        (error) => {
          console.error("Alerts listener error:", error);
          setError(error.message);
        },
      );
      unsubscribers.push(alertsUnsubscribe);

      // Real-time clusters listener
      const clustersQuery = query(
        collection(db, "clusters"),
        where("region", "==", region),
        orderBy("lastUpdated", "desc"),
        limit(20),
      );

      const clustersUnsubscribe = onSnapshot(
        clustersQuery,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const cluster = {
              id: change.doc.id,
              ...change.doc.data(),
            } as EventCluster;

            if (change.type === "modified") {
              console.log("Cluster updated:", cluster);
            }
          });

          const allClusters = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as EventCluster[];
          setClusters(allClusters);
        },
        (error) => {
          console.error("Clusters listener error:", error);
          setError(error.message);
        },
      );
      unsubscribers.push(clustersUnsubscribe);

      unsubscribersRef.current = unsubscribers;
      setIsConnected(true);
      setError(null);
      console.log("Firestore real-time listeners connected");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Connection failed");
    }
  }, [region]);

  const disconnect = useCallback(() => {
    unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribersRef.current = [];
    setIsConnected(false);
    console.log("Firestore listeners disconnected");
  }, []);

  const emit = useCallback((event: string, data: any) => {
    // For writing data to Firestore
    console.log("Emit to Firestore:", event, data);
    // You can implement specific Firestore write operations here
  }, []);

  // Event handler simulation (for compatibility with existing code)
  const on = useCallback((event: string, handler: Function) => {
    // Store handlers for specific events if needed
    console.log("Registered handler for:", event);
  }, []);

  const off = useCallback((event: string, handler?: Function) => {
    // Remove handlers if needed
    console.log("Removed handler for:", event);
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: null, // For compatibility
    isConnected,
    error,
    connectionAttempts: 0,
    connect,
    disconnect,
    emit,
    on,
    off,
    // Real-time data
    alerts,
    clusters,
  };
}
