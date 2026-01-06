import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (color) => new L.DivIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

const availableIcon = createIcon('#4ADE80'); // Green
const occupiedIcon = createIcon('#EA580C');  // Orange (Primary)

// Mock Data
const frontSlots = Array.from({ length: 10 }).map((_, i) => ({
    id: `F-${i + 1}`,
    lat: 51.5065 + (Math.random() * 0.0002),
    lng: 7.4566 + (Math.random() * 0.0002),
    isOccupied: Math.random() > 0.7
}));

const backSlots = Array.from({ length: 15 }).map((_, i) => ({
    id: `B-${i + 1}`,
    lat: 51.5061 + (Math.random() * 0.0002),
    lng: 7.4567 + (Math.random() * 0.0002),
    isOccupied: Math.random() > 0.6
}));

function MapUpdater({ center }) {
    const map = useMap();
    map.flyTo(center, 20);
    return null;
}

export default function MapVisualization({ side, onSelectSlot }) {
    const isFront = side === 'Front Side';
    const slots = isFront ? frontSlots : backSlots;
    const center = isFront ? [51.5065678, 7.4569925] : [51.5059979, 7.4568683];

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-inner z-0 relative">
            <MapContainer center={center} zoom={18} maxZoom={22} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={22}
                    maxNativeZoom={19}
                />
                <MapUpdater center={center} />
                {slots.map(slot => (
                    <Marker
                        key={slot.id}
                        position={[slot.lat, slot.lng]}
                        icon={slot.isOccupied ? occupiedIcon : availableIcon}
                        eventHandlers={{
                            click: () => !slot.isOccupied && onSelectSlot(slot)
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold">Slot {slot.id}</p>
                                <p className={slot.isOccupied ? "text-primary" : "text-green-500"}>
                                    {slot.isOccupied ? "Occupied" : "Available"}
                                </p>
                                {!slot.isOccupied && (
                                    <button
                                        className="mt-2 bg-primary text-white text-xs px-2 py-1 rounded"
                                        onClick={() => onSelectSlot(slot)}
                                    >
                                        Select
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
