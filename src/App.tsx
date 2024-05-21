import React, {
  Component,
  useEffect,
  useState,
  createContext,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import Select from 'react-select';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { GeoJsonLayerProps } from '@deck.gl/layers';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Source, Layer, MapRef, Popup } from 'react-map-gl';
import type { CircleLayer } from 'react-map-gl';
import { MapViewState } from '@deck.gl/core';
import type { FeatureCollection } from 'geojson';
import land_local from './data.json';
import { DeckGL } from 'deck.gl';
import {
  lotPolyStyle,
  cBoundaryPolyStyle,
  lotPtStyle,
  lotPtLabel,
  stationLabel,
  stationStyle,
} from './map-style';
import { uniqueValue, addDropdown } from './Query';
import { LngLatBounds } from 'react-map-gl';
import { features } from 'process';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import center from '@turf/center';
import { Label } from '@amcharts/amcharts5';
import { any } from '@amcharts/amcharts5/.internal/core/util/Array';

// Mapbox for React: https://visgl.github.io/react-map-gl/

function App() {
  let emptyFeatureCollection: any = { type: 'FeatureCollection', features: [] };
  let emptyFeatureCollection1: any = { type: 'FeatureCollection', features: [] };
  const mapRef = useRef<MapRef | undefined | any>();
  const [initStations, setInitStations] = useState<null | undefined | any>();
  const [stationSelected, setStationSelected] = useState<null | any>(null);
  const [allData, setAllData] = useState<FeatureCollection>();
  const [pointData, setPointData] = useState<FeatureCollection>();
  const [cboundaryData, setCboundaryData] = useState<FeatureCollection>();
  const [clickedInfo, setClickedInfo] = useState<any>(null);
  const [clickedBool, setClickedBool] = useState<boolean>(false);
  const [filteredGeojson, setFilteredGeojson] = useState<FeatureCollection>(emptyFeatureCollection);
  const [labelGeojson, setLabelGeojson] = useState<FeatureCollection>(emptyFeatureCollection1);

  // Load Geojson Data
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Land_Sample.geojson',
    )
      .then((resp) => resp.json())
      .then((json) => {
        setAllData(json);
        // Create a dropdown list
        let station_all: any = [];
        json.features.map((property: any, index: any) => {
          if (property.properties) {
            station_all.push(property.properties.Station1);
          }
        });
        const dropdownArray = uniqueValue(station_all).map((station: any, index: any) => {
          return Object.assign({
            field1: station,
          });
        });
        const final = addDropdown(dropdownArray, { field1: 'All' });
        setInitStations(final);

        // Label
        const labelPointFeature = json.features.map((feature: any, index: any) => {
          // get centroid of each polygon
          const bound_box = bbox(feature);
          const poly = bboxPolygon(bound_box);
          const {
            geometry: { coordinates: coordinatesCenter },
          } = center(poly);
          const value = coordinatesCenter.map((num: any) => Number(num));

          // get property values
          const cn_number = feature.properties['CN'];
          const station_name = feature.properties['Station1'];
          return Object.assign({
            type: 'Feature',
            id: index + 1,
            geometry: { type: 'Point', coordinates: value },
            properties: { Id: cn_number, Station1: station_name },
          });
        });

        labelGeojson.features = labelPointFeature;
      })
      .catch((err) => console.error('Could not load data', err));
  }, []);

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Station.geojson',
    )
      .then((resp) => resp.json())
      .then((json) => {
        setPointData(json);
      })
      .catch((err) => console.error('Could not load data', err));

    fetch(
      'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Construction_Boundary.geojson',
    )
      .then((resp) => resp.json())
      .then((json) => {
        setCboundaryData(json);
      })
      .catch((err) => console.error('Could not load data', err));
  }, []);

  const data = useMemo(() => {
    return [allData, pointData, labelGeojson, cboundaryData];
  }, [allData, pointData, labelGeojson, cboundaryData]);

  // Dropdown filter
  const handleMunicipalityChange = (obj: any) => {
    setStationSelected(obj);
  };

  // Popup
  const clickedOn = useCallback(
    (event: any) => {
      const {
        features,
        point: { x, y },
      } = event;
      const clickedFeature = features && features[0];
      setClickedBool(clickedBool === false ? true : true);

      setClickedInfo(clickedFeature && { feature: clickedFeature, x, y });
    },
    [clickedBool],
  );

  // Filter
  const filter = useMemo(
    () => ['in', 'Station1', stationSelected && stationSelected.field1],
    [stationSelected],
  );
  const filter_all = useMemo(() => ['!=', 'Id', true], [stationSelected]);

  // good sample for filtering
  // https://labs.mapbox.com/impact-tools/finder/
  // Zoom to bounds
  function zoomToLayer(search_property: any, zoom: any, data: any) {
    data[0]?.features.forEach((feature: any) => {
      // if (feature.properties['Station1'].includes('Tandang Sora')) { // includes keyword
      //   console.log(feature);
      // }
      if (feature.properties[search_property] === stationSelected.field1) {
        filteredGeojson.features.push(feature);
      }
    });

    const [minLng, minLat, maxLng, maxLat] = bbox(filteredGeojson);

    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 40, duration: 1000, zoom: zoom },
    );
  }

  useEffect(() => {
    if (stationSelected && stationSelected.field1 !== 'All') {
      // Reset filtered geojson layer
      setFilteredGeojson(emptyFeatureCollection);
      zoomToLayer('Station1', 16, data);
    } else if (stationSelected && stationSelected.field1 === 'All') {
      setFilteredGeojson(emptyFeatureCollection);
      data[0]?.features.forEach((feature: any) => {
        filteredGeojson.features.push(feature);
      });
      const [minLng, minLat, maxLng, maxLat] = bbox(filteredGeojson);
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 100, duration: 1000 },
      );
    }
  }, [stationSelected]);
  // test
  // Style CSS
  const customstyles = {
    option: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
      // const color = chroma(data.color);
      return {
        ...styles,
        backgroundColor: isFocused ? '#999999' : isSelected ? '#2b2b2b' : '#2b2b2b',
        color: '#ffffff',
        padding: '0px 5px',
      };
    },

    control: (defaultStyles: any) => ({
      ...defaultStyles,
      backgroundColor: '#2b2b2b',
      borderColor: '#949494',
      height: '35',
      width: '170px',
      color: '#ffffff',
    }),
    singleValue: (defaultStyles: any) => ({ ...defaultStyles, color: '#fff' }),
  };

  return (
    <div className="parent h-screen flex flex-col bg-slate-500">
      <header
        id="header"
        className="flex items-stretch h-fit p-4 m-1 bg-slate-800 text-slate-100 text-3xl/10"
      >
        <img
          src="https://EijiGorilla.github.io/Symbols/Projec_Logo/OCG.svg"
          width={50}
          className="mr-1 -mb-1"
        />
        Land Acquisition (Sample)
        {/* Dropdown filter */}
        <div className="text-sm">
          <Select
            placeholder="Select Station"
            value={stationSelected}
            options={initStations}
            onChange={handleMunicipalityChange}
            getOptionLabel={(x: any) => x.field1}
            styles={customstyles}
          />
        </div>
      </header>
      <Map
        ref={mapRef}
        mapboxAccessToken="pk.eyJ1IjoiZWlqaW1hdHN1emFraSIsImEiOiJjbHdhOTN2OGUwN3RyMnFwYWM0azE0c2E1In0.79awJ1I9uAJLQHWZ7btSFA"
        // style={{ width: 800, height: 1000 }}
        initialViewState={{
          longitude: 121.0319746,
          latitude: 14.6821565,
          zoom: 14,
        }}
        onClick={clickedOn}
        interactiveLayerIds={[
          'lotPoly',
          'stationPt',
          'stationPtLabel',
          'lotPt',
          'lotPtLabels',
          'lotPolyBoundary',
        ]}
        mapStyle={'mapbox://styles/mapbox/streets-v9'}
      >
        {/* why use useMemo? */}
        <Source type="geojson" data={data[0]}>
          <Layer {...lotPolyStyle} id="lotPoly" />
          <Layer
            {...lotPolyStyle}
            filter={stationSelected && stationSelected.field1 === 'All' ? filter_all : filter}
            id="lotPoly"
          />
        </Source>
        <Source type="geojson" data={data[3]}>
          <Layer {...cBoundaryPolyStyle} id="lotPolyBoundary" />
        </Source>
        <Source type="geojson" data={data[1]}>
          <Layer {...stationStyle} id="stationPt" />
          <Layer {...stationLabel} id="stationPtLabel" />
        </Source>
        <Source type="geojson" data={data[2]}>
          <Layer {...lotPtStyle} id="lotPt" />
          <Layer
            {...lotPtLabel}
            filter={
              stationSelected && stationSelected.field1 !== 'All'
                ? ['in', 'Station1', stationSelected.field1]
                : filter_all
            }
            id="lotPtLabels"
          />
        </Source>

        {clickedInfo && (
          <div
            className="w-30 h-10 absolute z-99 bg-white p-3 pt-1"
            style={{ left: clickedInfo.x, top: clickedInfo.y }}
          >
            <div>
              Station: <b>{clickedInfo.feature.properties.Station1}</b>
            </div>
            <div>
              Lot Id: <b>{clickedInfo.feature.properties.Id}</b>
            </div>
          </div>
        )}
      </Map>
    </div>
  );
}

export default App;
