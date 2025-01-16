import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default markers not showing
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = "https://api.waqi.info/feed/";
const API_KEY = import.meta.env.VITE_RAPID_API_KEY || 
                window.env?.RAPID_API_KEY || 
                "";

// Predefined important locations in Mumbai
const importantLocations = [
  { name: "Gateway of India", lat: 18.921984, lng: 72.834654 },
  { name: "Chhatrapati Shivaji Terminus", lat: 18.9402, lng: 72.8356 },
  { name: "Juhu Beach", lat: 19.099, lng: 72.826 },
  { name: "Marine Drive", lat: 18.9456, lng: 72.8245 },
  { name: "Bandra Kurla Complex", lat: 19.0653, lng: 72.8697 },
];

const fetchAQIData = async (lat, lng) => {
  try {
    const url = `${API_URL}geo:${lat};${lng}/?token=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === "ok") {
      return { aqi: data.data.aqi, name: data.data.city.name };
    } else {
      throw new Error("Invalid data received from API.");
    }
  } catch (error) {
    console.error("Error fetching AQI data:", error);
    throw error;
  }
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: async (event) => {
      const { lat, lng } = event.latlng;
      try {
        await onMapClick(lat, lng);
      } catch (error) {
        console.error("Error handling map click:", error);
      }
    },
  });
  return null;
};

const MapComponent = () => {
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMapClick = async (lat, lng) => {
    setIsLoading(true);
    try {
      const data = await fetchAQIData(lat, lng);
      setMarkers([{ lat, lng, aqi: data.aqi, name: data.name }]);
    } catch (error) {
      console.error("Failed to fetch AQI data:", error);
      alert("Failed to fetch AQI data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMumbaiAQI = async () => {
    const updatedMarkers = [];
    for (const location of importantLocations) {
      try {
        const data = await fetchAQIData(location.lat, location.lng);
        updatedMarkers.push({ ...location, aqi: data.aqi });
      } catch (error) {
        console.error(`Failed to fetch AQI for ${location.name}:`, error);
      }
    }
    setMarkers(updatedMarkers);
  };

  useEffect(() => {
    loadMumbaiAQI();
  }, []);

  return (
    <div style={styles.container}>
      <MapContainer
        center={[19.076, 72.8777]} // Centered on Mumbai
        zoom={12}
        scrollWheelZoom={true}
        style={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {markers.map((marker, index) => (
          <Marker key={`${marker.lat}-${marker.lng}-${index}`} position={[marker.lat, marker.lng]}>
            <Popup>
              <div style={styles.popup}>
                <h3 style={styles.locationName}>{marker.name || "Selected Location"}</h3>
                <p>
                  <span style={styles.label}>AQI:</span> {marker.aqi}
                </p>
                <p>
                  <span style={styles.label}>Lat:</span> {marker.lat.toFixed(4)}
                </p>
                <p>
                  <span style={styles.label}>Lng:</span> {marker.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {isLoading && (
        <div style={styles.loading}>Loading AQI data...</div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    height: "100vh",
    backgroundColor: "#f5f5f5",
    fontFamily: "'Roboto', sans-serif",
  },
  map: {
    height: "100vh",
    width: "100vw",
    border: "3px solid #0066cc",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
  popup: {
    textAlign: "left",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  locationName: {
    color: "#333",
    fontSize: "16px",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  label: {
    fontWeight: "bold",
    color: "#555",
  },
  loading: {
    position: "absolute",
    top: "20px",
    right: "20px",
    backgroundColor: "#fff",
    color: "#333",
    padding: "10px 15px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
    zIndex: 1000,
    fontSize: "14px",
    fontWeight: "bold",
  },
};

export default MapComponent;
