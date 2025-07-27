"use client";

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRealtimeData } from "./useRealtimeData"; // Updated import
import { civicApi } from "@/lib/api";
import { Alert, EventCluster } from "@/types/civic";

interface UseCivicDataOptions {
  region?: string;
  coordinates?: { latitude: number; longitude: number };
  enableRealTime?: boolean;
}

export function useCivicData(options: UseCivicDataOptions = {}) {
  const { region, coordinates, enableRealTime = true } = options; // ← Now defaults to true

  const queryClient = useQueryClient();

  // Use Firestore real-time instead of WebSocket
  const {
    isConnected,
    alerts: realtimeAlerts,
    clusters: realtimeClusters,
  } = useRealtimeData({
    region,
    coordinates,
    autoConnect: enableRealTime,
  });

  // Query keys
  const reportsKey = ["reports", region];

  // Reports query (still uses API since it might need processing)
  const reports = useQuery({
    queryKey: reportsKey,
    queryFn: async () => {
      const response = await civicApi.getReports();
      return response.data || [];
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: enableRealTime ? false : 120000,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Mutations
  const synthesizeMutation = useMutation({
    mutationFn: civicApi.generateSynthesis,
    onError: (error) => {
      console.error("Synthesis failed:", error);
    },
  });

  const analyzeMediaMutation = useMutation({
    mutationFn: civicApi.analyzeMedia,
    onError: (error) => {
      console.error("Media analysis failed:", error);
    },
  });

  // Utility functions
  const refetchAll = useCallback(() => {
    return reports.refetch();
  }, [reports.refetch]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: reportsKey });
  }, [queryClient, reportsKey]);

  return {
    // Real-time data from Firestore
    alerts: realtimeAlerts,
    clusters: realtimeClusters,
    reports: reports.data || [],

    // Loading states
    loading: reports.isLoading,
    alertsLoading: false, // Real-time, so no loading state
    clustersLoading: false,
    reportsLoading: reports.isLoading,

    // Error states
    error: reports.error,
    reportsError: reports.error,

    // Mutations
    synthesize: synthesizeMutation.mutate,
    synthesizing: synthesizeMutation.isPending,
    analyzeMedia: analyzeMediaMutation.mutate,
    analyzingMedia: analyzeMediaMutation.isPending,

    // Utilities
    refetchAll,
    clearCache,
    isConnected, // Now shows Firestore connection status

    // Query states
    reportsQuery: reports,
  };
}
