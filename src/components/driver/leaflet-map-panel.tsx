"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Map, Navigation } from "lucide-react";

type LeafletMapPanelProps = {
  center: {
    lat: number;
    lng: number;
  };
  pickups?: Array<{
    id: string;
    cafeName: string;
    address: string | null;
    lat: number;
    lng: number;
    status: string;
  }>;
};

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function markerColor(status: string) {
  if (status === "FAILED") {
    return "#b91c1c";
  }

  if (status === "WAITING_OTP") {
    return "#b45309";
  }

  return "#5b3524";
}

function makeMarkerIcon(status: string) {
  const color = markerColor(status);

  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 8px 20px rgba(44,24,16,.28)"></span>`,
    iconAnchor: [10, 10],
    iconSize: [20, 20]
  });
}

function makePopup(pickup: NonNullable<LeafletMapPanelProps["pickups"]>[number]) {
  const wrapper = document.createElement("div");
  wrapper.className = "space-y-1";

  const title = document.createElement("strong");
  title.textContent = pickup.cafeName;
  wrapper.appendChild(title);

  const address = document.createElement("p");
  address.style.margin = "4px 0 0";
  address.textContent = pickup.address ?? "Alamat pickup belum tersedia";
  wrapper.appendChild(address);

  return wrapper;
}

export function LeafletMapPanel({ center, pickups = [] }: LeafletMapPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
        zoomControl: false
      });

      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapRef.current);
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const points = pickups.length
      ? pickups
      : [{ id: "center", cafeName: "Area Pickup", address: null, lat: center.lat, lng: center.lng, status: "READY" }];

    points.forEach((pickup) => {
      const marker = L.marker([pickup.lat, pickup.lng], { icon: makeMarkerIcon(pickup.status) })
        .bindPopup(makePopup(pickup))
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    if (pickups.length > 1) {
      const bounds = L.latLngBounds(pickups.map((pickup) => [pickup.lat, pickup.lng]));
      mapRef.current.fitBounds(bounds, { padding: [36, 36] });
    } else {
      mapRef.current.setView([center.lat, center.lng], 15);
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [center.lat, center.lng, pickups]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative min-h-[70vh] overflow-hidden rounded-xl border border-coffee-200 bg-coffee-50">
      <div ref={containerRef} className="absolute inset-0" />
      {!pickups.length ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 rounded-xl border border-coffee-200 bg-white/95 p-4 text-sm text-coffee-700 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <Map className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-coffee-900">Belum ada titik pickup aktif</p>
              <p className="mt-1">Peta tetap siap digunakan saat task driver masuk.</p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-coffee-700 shadow-sm backdrop-blur">
        <span className="inline-flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          OpenStreetMap
        </span>
      </div>
    </div>
  );
}
