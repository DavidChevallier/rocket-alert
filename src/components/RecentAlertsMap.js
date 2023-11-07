import React from "react";
import polygons from "../polygons.json";

class RecentAlertsMap extends React.Component {
  state = {
    showMapWithUserLocation: false,
    timeToShelterText: "",
    timeToShelterShareText: "",
    alertExplanationText: "",
    alertExplanationShareText: "",
  };

  componentDidMount() {
    this.initMapWithAlertLocation();
  }

  async initMapWithAlertLocation() {
    window.mapboxgl.accessToken =
      "pk.eyJ1IjoiZXJlem5hZ2FyIiwiYSI6ImNsb2pmcXV4ZzFreXgyam8zdjdvdWtqMHMifQ.e2E4pq7dQZL7_YszHD25kA";
    const map = new window.mapboxgl.Map({
      container: "alerts_map",
      style: "mapbox://styles/mapbox/dark-v11",
      center: [this.props.alerts[0].lon, this.props.alerts[0].lat],
      cooperativeGestures: true,
    });

    const geojson = {
      type: "FeatureCollection",
      features: [],
    };

    map.on("load", () => {
      const alertNames = [];
      const bounds = new window.mapboxgl.LngLatBounds();
      this.props.alerts.forEach((alert) => {
        if (alertNames.includes(alert.name)) {
          console.log("inclues", alert.name);
          return;
        }
        alertNames.push(alert.name);

        bounds.extend([
          ...polygons[alert.taCityId]?.map(([lat, lon]) => [lon, lat]),
        ]);

        geojson.features.push({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              polygons[alert.taCityId]?.map(([lat, lon]) => [lon, lat]),
            ],
          },
        });

        // Add a marker
        const el = document.createElement("div");
        el.className = "map-marker";
        new window.mapboxgl.Marker(el)
          .setLngLat([alert.lon, alert.lat])
          .addTo(map);
      });

      // Add a new layer to visualize the polygons.
      map.addLayer({
        id: `polygon1`,
        type: "fill",
        source: {
          type: "geojson",
          data: geojson,
        },
        paint: {
          "fill-color": "red",
          "fill-opacity": 0.3,
        },
      });

      // Add am outline around the polygon.
      map.addLayer({
        id: `outline1`,
        type: "line",
        source: {
          type: "geojson",
          data: geojson,
        },
        paint: {
          "line-color": "red",
          "line-width": 1,
        },
      });

      map.fitBounds(bounds, {
        padding: { top: 50, bottom: 170 },
        animate: false,
      });
    });
  }

  render() {
    return (
      <section className="section map">
        <div id="alerts_map" style={{ height: "80vh" }}></div>
      </section>
    );
  }
}

export default RecentAlertsMap;
