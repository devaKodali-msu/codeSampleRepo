import React, { useState, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import * as d3 from 'd3-geo'; // For calculating centroids

// U.S. states GeoJSON
const geoJsonUS = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";
// Canadian provinces GeoJSON
const geoJsonCanada = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson";

const GlobeComponent = () => {
  const globeEl = useRef();
  const [polygons, setPolygons] = useState([]);
  const [highlightedPolygon, setHighlightedPolygon] = useState(null); // Track the highlighted polygon
  const [labels, setLabels] = useState([]);

  // Fetch GeoJSON data for U.S. states and Canadian provinces
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const [usResponse, canadaResponse] = await Promise.all([
          fetch(geoJsonUS),
          fetch(geoJsonCanada),
        ]);
        const usData = await usResponse.json();
        const canadaData = await canadaResponse.json();

        // Combine U.S. states and Canadian provinces
        const combinedPolygons = [
          ...usData.features.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              country: 'USA',
            }
          })),
          ...canadaData.features.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              country: 'Canada',
            }
          }))
        ];

        setPolygons(combinedPolygons);

        // Calculate centroids for labels
        const calculatedLabels = combinedPolygons.map(polygon => {
          const centroid = d3.geoCentroid(polygon); // Calculate the centroid of each state/province
          return {
            lat: centroid[1],
            lng: centroid[0],
            label: polygon.properties.name || polygon.properties.NAME, // State or province name
          };
        });

        setLabels(calculatedLabels); // Set the labels for the globe
      } catch (error) {
        console.error("Error fetching GeoJSON data:", error);
      }
    };

    fetchGeoJSON();

    // Set the camera to focus on the U.S. and Canada, adjusted for a zoomed-in view
    globeEl.current.pointOfView({ lat: 50.0, lng: -95.0, altitude: 1.25 }, 3000); // More zoomed-in view
  }, []);

  const handlePolygonClick = (polygon) => {
    // Highlight the polygon only if it's valid
    if (polygon) {
      setHighlightedPolygon(polygon);
    } else {
      setHighlightedPolygon(null); // Reset highlight if clicked outside a polygon
    }
  };

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" // Daylight texture
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Enable rotation
        animateIn={true} // Set to true to enable automatic rotation
        rotationSpeed={0.1} // Adjust the speed of rotation (can be positive or negative for direction)

        // Set state/province polygons data
        polygonsData={polygons}
        polygonAltitude={0.01} // Keep polygons flat
        polygonCapColor={d => (d === highlightedPolygon ? 'orange' : 'transparent')} // Highlight color when clicked
        polygonSideColor={() => 'rgba(0, 0, 0, 0.1)'} // Light color for side
        polygonStrokeColor={() => '#111'} // Border color
        onPolygonClick={handlePolygonClick} // Handle polygon click to highlight
        polygonsTransitionDuration={300}

        // Add labels for state and province names
        labelsData={labels}
        labelLat={d => d.lat}
        labelLng={d => d.lng}
        labelText={d => d.label}
        labelSize={0.8} // Smaller size for the text
        labelColor={() => 'black'} // Set label color to black
        labelResolution={2} // Label clarity
      />
    </div>
  );
};

export default GlobeComponent;
