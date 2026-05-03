import os
import folium
from folium.plugins import HeatMap
from sklearn.cluster import DBSCAN
import numpy as np

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")


def _complaints_with_coords(complaints: list):
    return [c for c in complaints if c.latitude is not None and c.longitude is not None]


def build_map(complaints: list) -> folium.Map:
    """Build a Folium map with heatmap and optional DBSCAN cluster centers."""
    m = folium.Map(location=[33.6844, 73.0479], zoom_start=12)
    valid = _complaints_with_coords(complaints)
    coords = [[c.latitude, c.longitude] for c in valid]

    if coords:
        HeatMap(coords, radius=12, blur=18).add_to(m)

        X = np.radians(np.array(coords))
        if len(X) >= 2:
            kms_per_radian = 6371.0
            epsilon_km = 0.5
            db = DBSCAN(
                eps=epsilon_km / kms_per_radian,
                min_samples=2,
                metric="haversine",
            ).fit(X)
            labels = db.labels_
            for label in set(labels):
                if label == -1:
                    continue
                cluster_pts = [coords[i] for i in range(len(coords)) if labels[i] == label]
                lat_c = sum(p[0] for p in cluster_pts) / len(cluster_pts)
                lon_c = sum(p[1] for p in cluster_pts) / len(cluster_pts)
                folium.Marker(
                    [lat_c, lon_c],
                    popup=f"Hotspot cluster ({len(cluster_pts)} reports)",
                    icon=folium.Icon(color="red", icon="info-sign"),
                ).add_to(m)

    return m


def save_heatmap_html(complaints: list, path: str) -> str:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    m = build_map(complaints)
    m.save(path)
    return path


def run(complaints: list) -> str:
    print("Agent 4: GPS Clustering (Geo Agent)")
    os.makedirs(STATIC_DIR, exist_ok=True)
    heatmap_path = os.path.join(STATIC_DIR, "heatmap.html")
    return save_heatmap_html(complaints, heatmap_path)
