"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
  Circle,
} from "@react-google-maps/api";
import { useCivicData } from "@/hooks/useCivicData";
import { Alert, EventCluster, CivicEvent } from "@/types/civic";
import { AlertTriangle, MapPin, Users, Clock } from "lucide-react";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

// Map styling for civic theme
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
];

interface CivicMapProps {
  region?: string;
  initialCenter?: { lat: number; lng: number };
  height?: string;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export function CivicMap({
  region = "bangalore-central",
  initialCenter = { lat: 12.9716, lng: 77.5946 },
  height = "600px",
  onLocationSelect,
}: CivicMapProps) {
  const { alerts, clusters, reports, loading, isConnected } = useCivicData({
    region,
  });

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<EventCluster | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Memoized marker data
  const alertMarkers = useMemo(
    () =>
      alerts.map((alert) => ({
        ...alert,
        position: {
          lat: alert.location.lat,
          lng: alert.location.lng,
        },
      })),
    [alerts],
  );

  const clusterMarkers = useMemo(
    () =>
      clusters.map((cluster) => ({
        ...cluster,
        position: {
          lat: cluster.location.lat,
          lng: cluster.location.lng,
        },
      })),
    [clusters],
  );

  // Icon configurations
  const getAlertIcon = useCallback((severity: string): google.maps.Symbol => {
    const colors = {
      LOW: "#10B981", // Green
      MEDIUM: "#F59E0B", // Yellow
      HIGH: "#EF4444", // Red
      CRITICAL: "#7C2D12", // Dark Red
    };

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: colors[severity as keyof typeof colors] || colors.MEDIUM,
      fillOpacity: 0.8,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: severity === "CRITICAL" ? 12 : severity === "HIGH" ? 10 : 8,
    };
  }, []);

  const getClusterIcon = useCallback(
    (cluster: EventCluster): google.maps.Symbol => {
      const size = Math.min(Math.max(cluster.events.length * 2, 8), 20);

      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#3B82F6",
        fillOpacity: 0.3,
        strokeColor: "#1D4ED8",
        strokeWeight: 2,
        scale: size,
      };
    },
    [],
  );

  // Map event handlers
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng && onLocationSelect) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        onLocationSelect({ lat, lng });
      }
      // Close any open info windows
      setSelectedAlert(null);
      setSelectedCluster(null);
    },
    [onLocationSelect],
  );

  // Auto-fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || (!alertMarkers.length && !clusterMarkers.length))
      return;

    const bounds = new google.maps.LatLngBounds();

    alertMarkers.forEach((marker) => bounds.extend(marker.position));
    clusterMarkers.forEach((marker) => bounds.extend(marker.position));

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds);
    }
  }, [alertMarkers, clusterMarkers]);

  const mapOptions = useMemo(
    (): google.maps.MapOptions => ({
      styles: mapStyles,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      clickableIcons: false,
    }),
    [],
  );

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md px-3 py-2">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading civic data...</span>
          </div>
        </div>
      )}

      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={libraries}
        loadingElement={<div style={{ height }}>Loading map...</div>}
      >
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={mapCenter}
          zoom={mapZoom}
          options={mapOptions}
          onLoad={onMapLoad}
          onClick={onMapClick}
        >
          {/* Alert markers */}
          {alertMarkers.map((alert) => (
            <Marker
              key={`alert-${alert.id}`}
              position={alert.position}
              icon={getAlertIcon(alert.severity)}
              title={alert.summary}
              onClick={() => {
                setSelectedAlert(alert);
                setSelectedCluster(null);
              }}
            />
          ))}

          {/* Cluster markers and circles */}
          {clusterMarkers.map((cluster) => (
            <React.Fragment key={`cluster-${cluster.id}`}>
              <Marker
                position={cluster.position}
                icon={getClusterIcon(cluster)}
                title={`Cluster: ${cluster.events.length} events`}
                onClick={() => {
                  setSelectedCluster(cluster);
                  setSelectedAlert(null);
                }}
              />
              <Circle
                center={cluster.position}
                radius={cluster.radius}
                options={{
                  fillColor: "#3B82F6",
                  fillOpacity: 0.1,
                  strokeColor: "#1D4ED8",
                  strokeOpacity: 0.3,
                  strokeWeight: 1,
                }}
              />
            </React.Fragment>
          ))}

          {/* Alert info window */}
          {selectedAlert && (
            <InfoWindow
              position={{
                lat: selectedAlert.location.lat,
                lng: selectedAlert.location.lng,
              }}
              onCloseClick={() => setSelectedAlert(null)}
            >
              <div className="max-w-sm p-2">
                <div className="flex items-start space-x-2">
                  <AlertTriangle
                    className={`w-5 h-5 mt-0.5 ${
                      selectedAlert.severity === "CRITICAL"
                        ? "text-red-700"
                        : selectedAlert.severity === "HIGH"
                          ? "text-red-500"
                          : selectedAlert.severity === "MEDIUM"
                            ? "text-yellow-500"
                            : "text-green-500"
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {selectedAlert.summary}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedAlert.recommendation}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Confidence: {selectedAlert.confidence}%</span>
                      <span>
                        {new Date(selectedAlert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Cluster info window */}
          {selectedCluster && (
            <InfoWindow
              position={{
                lat: selectedCluster.location.lat,
                lng: selectedCluster.location.lng,
              }}
              onCloseClick={() => setSelectedCluster(null)}
            >
              <div className="max-w-sm p-2">
                <div className="flex items-start space-x-2">
                  <Users className="w-5 h-5 mt-0.5 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Event Cluster
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedCluster.events.length} events in this area
                    </p>
                    <div className="space-y-1">
                      {selectedCluster.events.slice(0, 3).map((event) => (
                        <div key={event.id} className="text-xs text-gray-600">
                          • {event.title}
                        </div>
                      ))}
                      {selectedCluster.events.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{selectedCluster.events.length - 3} more events
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
