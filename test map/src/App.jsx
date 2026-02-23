
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import './App.css';

// We don't need the default icon override anymore as we use custom DivIcons

const API_URL = 'http://localhost:3001/api/coordinates';

// Helper to create a custom numbered icon
const createNumberedIcon = (number) => {
  return L.divIcon({
    className: 'custom-icon-marker',
    html: `<div class="pin-number"><span>${number}</span></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40] // Adjusted popup position
  });
};

function App() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarkers();
  }, []);

  const fetchMarkers = async () => {
    try {
      const response = await axios.get(API_URL);
      setMarkers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching markers:", error);
      setLoading(false);
    }
  };

  const saveMarkers = async (updatedMarkers) => {
    setMarkers(updatedMarkers);
    try {
      await axios.post(API_URL, updatedMarkers);
    } catch (error) {
      console.error("Error saving markers:", error);
    }
  };

  const handleMarkerDragEnd = (index, event) => {
    const marker = event.target;
    const position = marker.getLatLng();
    const updatedMarkers = [...markers];
    updatedMarkers[index] = {
      ...updatedMarkers[index],
      lat: position.lat,
      lng: position.lng
    };
    saveMarkers(updatedMarkers);
  };

  const AddMarkerOnClick = () => {
    useMapEvents({
      click(e) {
        if (window.confirm("Do you want to add a new pin here?")) {
          // We keep the file property unique but use index for display
          const newMarker = {
            file: `New_Pin_${Date.now()}`,
            lat: e.latlng.lat,
            lng: e.latlng.lng
          };
          const updatedMarkers = [...markers, newMarker];
          saveMarkers(updatedMarkers);
        }
      },
    });
    return null;
  };

  // Center map on the first marker or a default location
  const center = markers.length > 0
    ? [markers[0].lat, markers[0].lng]
    : [51.505, -0.09];

  if (loading) return <div className="loading">Loading Map Data...</div>;

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Parking Map</h2>
        <p><strong>Total Pins:</strong> {markers.length}</p>
        <div className="instructions">
          <p>📍 <strong>Hover</strong> to view details</p>
          <p>🖱️ <strong>Click</strong> on map to add pin</p>
          <p>✋ <strong>Drag</strong> pins to move</p>
        </div>
        <div className="coordinates-list">
          {markers.slice(0, 50).map((m, i) => (
            <div key={i} className="coord-item">
              <span className="file-name">Pin #{i + 1}</span>
            </div>
          ))}
          {markers.length > 50 && <div className="more">...and {markers.length - 50} more</div>}
        </div>
      </div>
      <div className="map-view">
        <MapContainer center={center} zoom={18} maxZoom={28} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={28}
            maxNativeZoom={19}
          />
          <AddMarkerOnClick />
          {Array.from({ length: 20 }).map((_, i) => {
            const startUpper = 110 + i; // Pin 111
            const startLower = 89 - i;  // Pin 90

            // Ensure we have all 4 markers available for the current quadrilateral
            if (markers.length > Math.max(startUpper + 1, startLower) && markers[startUpper] && markers[startUpper + 1] && markers[startLower] && markers[startLower - 1]) {
              return (
                <Polygon
                  key={`poly-${i}`}
                  positions={[
                    [markers[startUpper].lat, markers[startUpper].lng],
                    [markers[startUpper + 1].lat, markers[startUpper + 1].lng],
                    [markers[startLower - 1].lat, markers[startLower - 1].lng],
                    [markers[startLower].lat, markers[startLower].lng],
                  ]}
                  pathOptions={{ color: 'black', weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => {
                      e.target.setStyle({ color: '#228be6', weight: 3 });
                    },
                    mouseout: (e) => {
                      e.target.setStyle({ color: 'black', weight: 2 });
                    }
                  }}
                >
                  <Tooltip sticky>F{i + 1}</Tooltip>
                </Polygon>
              );
            }
            return null;
          })}
          {markers.length >= 157 && (
            <Polygon
              positions={[
                [markers[90].lat, markers[90].lng],  // Pin 91
                [markers[91].lat, markers[91].lng],  // Pin 92
                [markers[155].lat, markers[155].lng],// Pin 156
                [markers[156].lat, markers[156].lng] // Pin 157
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#228be6', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>F21</Tooltip>
            </Polygon>
          )}
          {Array.from({ length: 18 }).map((_, i) => {
            const startUpper = 91 + i; // Pin 92 (index 91)
            const startLower = 155 - i; // Pin 156 (index 155)

            if (markers.length > Math.max(startUpper + 1, startLower) && markers[startUpper] && markers[startUpper + 1] && markers[startLower] && markers[startLower - 1]) {
              return (
                <Polygon
                  key={`poly-f22-${i}`}
                  positions={[
                    [markers[startUpper].lat, markers[startUpper].lng],
                    [markers[startUpper + 1].lat, markers[startUpper + 1].lng],
                    [markers[startLower - 1].lat, markers[startLower - 1].lng],
                    [markers[startLower].lat, markers[startLower].lng],
                  ]}
                  pathOptions={{ color: 'black', weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ color: '#228be6', weight: 3 }); },
                    mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
                  }}
                >
                  <Tooltip sticky>F{22 + i}</Tooltip>
                </Polygon>
              );
            }
            return null;
          })}
          {markers.length >= 138 && (
            <Polygon
              positions={[
                [markers[68].lat, markers[68].lng],   // Pin 69
                [markers[109].lat, markers[109].lng], // Pin 110
                [markers[137].lat, markers[137].lng], // Pin 138
                [markers[136].lat, markers[136].lng]  // Pin 137
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#228be6', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>F40</Tooltip>
            </Polygon>
          )}
          {markers.length >= 159 && (
            <Polygon
              positions={[
                [markers[0].lat, markers[0].lng],     // Pin 1
                [markers[1].lat, markers[1].lng],     // Pin 2
                [markers[158].lat, markers[158].lng], // Pin 159
                [markers[157].lat, markers[157].lng]  // Pin 158
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B1</Tooltip>
            </Polygon>
          )}
          {Array.from({ length: 5 }).map((_, i) => {
            const startUpper = 1 + i;    // Pin 2 (index 1)
            const startLower = 159 + i;  // Pin 160 (index 159)

            if (markers.length > startLower && markers[startUpper] && markers[startUpper + 1] && markers[startLower] && markers[startLower - 1]) {
              return (
                <Polygon
                  key={`poly-b2-${i}`}
                  positions={[
                    [markers[startUpper].lat, markers[startUpper].lng],
                    [markers[startUpper + 1].lat, markers[startUpper + 1].lng],
                    [markers[startLower].lat, markers[startLower].lng],
                    [markers[startLower - 1].lat, markers[startLower - 1].lng],
                  ]}
                  pathOptions={{ color: 'black', weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                    mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
                  }}
                >
                  <Tooltip sticky>B{2 + i}</Tooltip>
                </Polygon>
              );
            }
            return null;
          })}
          {markers.length >= 164 && (
            <Polygon
              positions={[
                [markers[6].lat, markers[6].lng],   // Pin 7
                [markers[7].lat, markers[7].lng],   // Pin 8
                [markers[9].lat, markers[9].lng],   // Pin 10
                [markers[163].lat, markers[163].lng] // Pin 164
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B7</Tooltip>
            </Polygon>
          )}
          {markers.length >= 30 && (
            <Polygon
              positions={[
                [markers[26].lat, markers[26].lng],   // Pin 27
                [markers[28].lat, markers[28].lng],   // Pin 29
                [markers[29].lat, markers[29].lng],   // Pin 30
                [markers[27].lat, markers[27].lng]    // Pin 28
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B8</Tooltip>
            </Polygon>
          )}
          {markers.length >= 32 && (
            <Polygon
              positions={[
                [markers[28].lat, markers[28].lng],   // Pin 29
                [markers[30].lat, markers[30].lng],   // Pin 31
                [markers[31].lat, markers[31].lng],   // Pin 32
                [markers[29].lat, markers[29].lng]    // Pin 30
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B9</Tooltip>
            </Polygon>
          )}
          {markers.length >= 34 && (
            <Polygon
              positions={[
                [markers[30].lat, markers[30].lng],   // Pin 31
                [markers[32].lat, markers[32].lng],   // Pin 33
                [markers[33].lat, markers[33].lng],   // Pin 34
                [markers[31].lat, markers[31].lng]    // Pin 32
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B10</Tooltip>
            </Polygon>
          )}
          {markers.length >= 59 && (
            <Polygon
              positions={[
                [markers[32].lat, markers[32].lng],   // Pin 33
                [markers[57].lat, markers[57].lng],   // Pin 58
                [markers[58].lat, markers[58].lng],   // Pin 59
                [markers[33].lat, markers[33].lng]    // Pin 34
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B11</Tooltip>
            </Polygon>
          )}
          {markers.length >= 68 && (
            <Polygon
              positions={[
                [markers[55].lat, markers[55].lng],   // Pin 56
                [markers[67].lat, markers[67].lng],   // Pin 68
                [markers[66].lat, markers[66].lng],   // Pin 67
                [markers[56].lat, markers[56].lng]    // Pin 57
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B12</Tooltip>
            </Polygon>
          )}
          {markers.length >= 68 && (
            <Polygon
              positions={[
                [markers[67].lat, markers[67].lng],   // Pin 68
                [markers[64].lat, markers[64].lng],   // Pin 65
                [markers[65].lat, markers[65].lng],   // Pin 66
                [markers[66].lat, markers[66].lng]    // Pin 67
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B13</Tooltip>
            </Polygon>
          )}
          {markers.length >= 66 && (
            <Polygon
              positions={[
                [markers[64].lat, markers[64].lng],   // Pin 65
                [markers[63].lat, markers[63].lng],   // Pin 64
                [markers[62].lat, markers[62].lng],   // Pin 63
                [markers[65].lat, markers[65].lng]    // Pin 66
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B14</Tooltip>
            </Polygon>
          )}
          {markers.length >= 64 && (
            <Polygon
              positions={[
                [markers[63].lat, markers[63].lng],   // Pin 64
                [markers[60].lat, markers[60].lng],   // Pin 61
                [markers[61].lat, markers[61].lng],   // Pin 62
                [markers[62].lat, markers[62].lng]    // Pin 63
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B15</Tooltip>
            </Polygon>
          )}
          {markers.length >= 15 && (
            <Polygon
              positions={[
                [markers[13].lat, markers[13].lng],   // Pin 14
                [markers[14].lat, markers[14].lng],   // Pin 15
                [markers[11].lat, markers[11].lng],   // Pin 12
                [markers[10].lat, markers[10].lng]    // Pin 11
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B16</Tooltip>
            </Polygon>
          )}
          {markers.length >= 16 && (
            <Polygon
              positions={[
                [markers[14].lat, markers[14].lng],   // Pin 15
                [markers[15].lat, markers[15].lng],   // Pin 16
                [markers[12].lat, markers[12].lng],   // Pin 13
                [markers[11].lat, markers[11].lng]    // Pin 12
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B17</Tooltip>
            </Polygon>
          )}
          {markers.length >= 18 && (
            <Polygon
              positions={[
                [markers[15].lat, markers[15].lng],   // Pin 16
                [markers[16].lat, markers[16].lng],   // Pin 17
                [markers[17].lat, markers[17].lng],   // Pin 18
                [markers[12].lat, markers[12].lng]    // Pin 13
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B18</Tooltip>
            </Polygon>
          )}
          {markers.length >= 24 && (
            <Polygon
              positions={[
                [markers[18].lat, markers[18].lng],   // Pin 19
                [markers[19].lat, markers[19].lng],   // Pin 20
                [markers[23].lat, markers[23].lng],   // Pin 24
                [markers[22].lat, markers[22].lng]    // Pin 23
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B19</Tooltip>
            </Polygon>
          )}
          {Array.from({ length: 2 }).map((_, i) => {
            const startUpper = 19 + i; // Pin 20 (index 19)
            const startLower = 23 + i; // Pin 24 (index 23)

            if (markers.length > startLower + 1 && markers[startUpper] && markers[startUpper + 1] && markers[startLower] && markers[startLower + 1]) {
              return (
                <Polygon
                  key={`poly-b20-${i}`}
                  positions={[
                    [markers[startUpper].lat, markers[startUpper].lng],
                    [markers[startUpper + 1].lat, markers[startUpper + 1].lng],
                    [markers[startLower + 1].lat, markers[startLower + 1].lng],
                    [markers[startLower].lat, markers[startLower].lng],
                  ]}
                  pathOptions={{ color: 'black', weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                    mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
                  }}
                >
                  <Tooltip sticky>B{20 + i}</Tooltip>
                </Polygon>
              );
            }
            return null;
          })}
          {markers.length >= 136 && (
            <Polygon
              positions={[
                [markers[21].lat, markers[21].lng],   // Pin 22
                [markers[135].lat, markers[135].lng], // Pin 136
                [markers[34].lat, markers[34].lng],   // Pin 35
                [markers[25].lat, markers[25].lng]    // Pin 26
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B22</Tooltip>
            </Polygon>
          )}
          {markers.length >= 133 && (
            <Polygon
              positions={[
                [markers[131].lat, markers[131].lng], // Pin 132
                [markers[132].lat, markers[132].lng], // Pin 133
                [markers[36].lat, markers[36].lng],   // Pin 37
                [markers[35].lat, markers[35].lng]    // Pin 36
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B23</Tooltip>
            </Polygon>
          )}
          {markers.length >= 134 && (
            <Polygon
              positions={[
                [markers[132].lat, markers[132].lng], // Pin 133
                [markers[133].lat, markers[133].lng], // Pin 134
                [markers[37].lat, markers[37].lng],   // Pin 38
                [markers[36].lat, markers[36].lng]    // Pin 37
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B24</Tooltip>
            </Polygon>
          )}
          {markers.length >= 135 && (
            <Polygon
              positions={[
                [markers[133].lat, markers[133].lng], // Pin 134
                [markers[134].lat, markers[134].lng], // Pin 135
                [markers[38].lat, markers[38].lng],   // Pin 39
                [markers[37].lat, markers[37].lng]    // Pin 38
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B25</Tooltip>
            </Polygon>
          )}
          {markers.length >= 135 && (
            <Polygon
              positions={[
                [markers[134].lat, markers[134].lng], // Pin 135
                [markers[40].lat, markers[40].lng],   // Pin 41
                [markers[39].lat, markers[39].lng],   // Pin 40
                [markers[38].lat, markers[38].lng]    // Pin 39
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B26</Tooltip>
            </Polygon>
          )}
          {markers.length >= 50 && (
            <Polygon
              positions={[
                [markers[41].lat, markers[41].lng],   // Pin 42
                [markers[42].lat, markers[42].lng],   // Pin 43
                [markers[49].lat, markers[49].lng],   // Pin 50
                [markers[48].lat, markers[48].lng]    // Pin 49
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B27</Tooltip>
            </Polygon>
          )}
          {Array.from({ length: 5 }).map((_, i) => {
            const startUpper = 42 + i; // Pin 43 (index 42)
            const startLower = 49 + i; // Pin 50 (index 49)

            if (markers.length > startLower + 1 && markers[startUpper] && markers[startUpper + 1] && markers[startLower] && markers[startLower + 1]) {
              return (
                <Polygon
                  key={`poly-b28-${i}`}
                  positions={[
                    [markers[startUpper].lat, markers[startUpper].lng],
                    [markers[startUpper + 1].lat, markers[startUpper + 1].lng],
                    [markers[startLower + 1].lat, markers[startLower + 1].lng],
                    [markers[startLower].lat, markers[startLower].lng],
                  ]}
                  pathOptions={{ color: 'black', weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                    mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
                  }}
                >
                  <Tooltip sticky>B{28 + i}</Tooltip>
                </Polygon>
              );
            }
            return null;
          })}
          {markers.length >= 165 && (
            <Polygon
              positions={[
                [markers[47].lat, markers[47].lng],   // Pin 48
                [markers[164].lat, markers[164].lng], // Pin 165
                [markers[59].lat, markers[59].lng],   // Pin 60
                [markers[54].lat, markers[54].lng]    // Pin 55
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B33</Tooltip>
            </Polygon>
          )}
          {markers.length >= 187 && (
            <Polygon
              positions={[
                [markers[175].lat, markers[175].lng], // Pin 176
                [markers[174].lat, markers[174].lng], // Pin 175
                [markers[185].lat, markers[185].lng], // Pin 186
                [markers[186].lat, markers[186].lng]  // Pin 187
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B34</Tooltip>
            </Polygon>
          )}
          {markers.length >= 188 && (
            <Polygon
              positions={[
                [markers[176].lat, markers[176].lng], // Pin 177
                [markers[175].lat, markers[175].lng], // Pin 176
                [markers[186].lat, markers[186].lng], // Pin 187
                [markers[187].lat, markers[187].lng]  // Pin 188
              ]}
              pathOptions={{ color: 'black', weight: 2 }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
              }}
            >
              <Tooltip sticky>B44</Tooltip>
            </Polygon>
          )}
          {Array.from({ length: 9 }).map((_, i) => {
            const startUpper = 174 - i; // Pin 175 (index 174)
            const startLower = 185 - i; // Pin 186 (index 185)

            if (markers.length > Math.max(startUpper, startLower) && markers[startUpper] && markers[startUpper - 1] && markers[startLower] && markers[startLower - 1]) {
              return (
                <Polygon
                  key={`poly-b35-${i}`}
                  positions={[
                    [markers[startUpper].lat, markers[startUpper].lng],
                    [markers[startUpper - 1].lat, markers[startUpper - 1].lng],
                    [markers[startLower - 1].lat, markers[startLower - 1].lng],
                    [markers[startLower].lat, markers[startLower].lng],
                  ]}
                  pathOptions={{ color: 'black', weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ color: '#f03e3e', weight: 3 }); },
                    mouseout: (e) => { e.target.setStyle({ color: 'black', weight: 2 }); }
                  }}
                >
                  <Tooltip sticky>B{35 + i}</Tooltip>
                </Polygon>
              );
            }
            return null;
          })}
          {markers.map((marker, index) => (
            <DraggableMarker
              key={`${marker.file}-${index}`}
              position={[marker.lat, marker.lng]}
              index={index + 1}
              onDragEnd={(e) => handleMarkerDragEnd(index, e)}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

const DraggableMarker = ({ position, index, onDragEnd }) => {
  const markerRef = useRef(null);

  // Memoize the icon to prevent flickering
  const icon = useMemo(() => createNumberedIcon(index), [index]);

  const eventHandlers = useMemo(
    () => ({
      dragend(e) {
        onDragEnd(e);
      },
      mouseover(e) {
        e.target.openPopup();
      },
      mouseout(e) {
        e.target.closePopup();
      }
    }),
    [onDragEnd],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={icon}
      ref={markerRef}>
      <Popup>
        <strong>Pin #{index}</strong><br />
        Lat: {position[0].toFixed(6)}<br />
        Lng: {position[1].toFixed(6)}
      </Popup>
    </Marker>
  )
}

export default App;
