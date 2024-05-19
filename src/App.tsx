import React, {
  Component,
  useEffect,
  useState,
  createContext,
  useContext,
  useRef,
  useMemo,
} from 'react';
import Select from 'react-select';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { GeoJsonLayerProps } from '@deck.gl/layers';
import './App.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Source, Layer, MapRef } from 'react-map-gl';
import type { CircleLayer } from 'react-map-gl';
import { MapViewState } from '@deck.gl/core';
import type { FeatureCollection } from 'geojson';
import land_local from './data.json';
import { DeckGL } from 'deck.gl';
import { dataLayerFill, dataLayerLine } from './map-style';
import { uniqueValue, addDropdown } from './Query';
import { LngLatBounds } from 'react-map-gl';
import { features } from 'process';
import bbox from '@turf/bbox';

// Mapbox for React: https://visgl.github.io/react-map-gl/

function App() {
  const mapRef = useRef<MapRef | undefined | any>();
  const [initStations, setInitStations] = useState<null | undefined | any>();
  const [stationSelected, setStationSelected] = useState<null | any>(null);
  const [allData, setAllData] = useState<FeatureCollection>();
  const [initialData, setInitialData] = useState<FeatureCollection>();
  const [testClicked, setTestClicked] = useState<boolean>(false);

  // const layer = new GeoJsonLayer<PropertiesType>({
  //   id: 'GeoJsonLayer',
  //   data: 'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Land_Sample.geojson',
  //   filled: true,
  // });
  //

  // Load Geojson Data
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Land_Sample.geojson',
    )
      .then((resp) => resp.json())
      .then((json) => {
        setAllData(json);
        setInitialData(json);
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
      })
      .catch((err) => console.error('Could not load data', err));
  }, []);

  const data = useMemo(() => {
    return allData;
  }, [allData]);

  // Dropdown filter
  const handleMunicipalityChange = (obj: any) => {
    setStationSelected(obj);
  };

  // Filter
  const filter = useMemo(
    () => ['in', 'Station1', stationSelected && stationSelected.field1],
    [stationSelected],
  );

  // Id field is NOT empty
  const filter_all = useMemo(() => ['!=', 'Id', true], [stationSelected]);

  // Zoom to bounds
  useEffect(() => {
    if (stationSelected) {
      // const [minLng, minLat, maxLng, maxLat] = bbox(allData?.features[0]);
      const feature = allData?.features[0].geometry;
      const [minLng, minLat, maxLng, maxLat] = bbox(feature);

      console.log(minLat);
    }

    // const feature = event.features[0];

    // // calculate the bounding box of the feature
    // const [minLng, minLat, maxLng, maxLat] = bbox(feature);

    // mapRef.current.fitBounds(
    //   [
    //     [minLng, minLat],
    //     [maxLng, maxLat],
    //   ],
    //   { padding: 40, duration: 1000 },
    // );
  }, [stationSelected]);

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
        interactiveLayerIds={['data', 'dataLine']}
        mapStyle={'mapbox://styles/mapbox/streets-v9'}
      >
        {/* why use useMemo? */}
        <Source type="geojson" data={data}>
          <Layer {...dataLayerFill} />
          <Layer
            {...dataLayerFill}
            filter={stationSelected && stationSelected.field1 === 'All' ? filter_all : filter}
          />
        </Source>
      </Map>
    </div>
  );
}

export default App;
