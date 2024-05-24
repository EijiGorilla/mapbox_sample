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
import Map, { Source, Layer, MapRef, Popup, useControl } from 'react-map-gl';
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
  structureStyle,
  highlightedLotPolyStyle,
} from './map-style';
import { uniqueValue, addDropdown, updatechartData } from './Query';
import { LngLatBounds } from 'react-map-gl';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import center from '@turf/center';
import LegendControl from 'mapboxgl-legend';
import 'mapboxgl-legend/dist/style.css';
import {
  statusLotColor,
  statusLotLabel,
  statusLotQuery,
  statusStructureColor,
  statusStructureLabel,
  statusStructureQuery,
} from './statusUniqueValues';
import { Tabs } from 'flowbite';
import type { TabsOptions, TabsInterface, TabItem } from 'flowbite';
import type { InstanceOptions } from 'flowbite';
import LotChart from './components/Lot_Chart';

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
  const [structureData, setStructureData] = useState<FeatureCollection>();
  const [clickedInfo, setClickedInfo] = useState<any>(null);
  const [clickedBool, setClickedBool] = useState<boolean>(false);
  const [filteredGeojson, setFilteredGeojson] = useState<FeatureCollection>(emptyFeatureCollection);
  const [labelGeojson, setLabelGeojson] = useState<FeatureCollection>(emptyFeatureCollection1);
  const [inputValue, setInputValue] = useState<any>();

  // Legend
  const [lotLayerToggle, setLotLayerToggle] = useState<boolean>(true);
  const [legendClickedCategory, setLegendClickedCategory] = useState<any>();
  const [legendClickedValue, setLegendClickedValue] = useState<any>();
  const [structureLayerToggle, setStructureLayerToggle] = useState<boolean>(true);
  const [legendStructureClickedCategory, setLegendStructureClickedCategory] = useState<any>();
  const [legendStructureClickedValue, setLegendStructureClickedValue] = useState<any>();
  const [resetLegendButton, setResetLegendButton] = useState<any>('unclicked');

  // Chart data
  const [chartData, setChartData] = useState<any>();

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

        // Chart data
        setChartData(updatechartData(json.features, 'All'));
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

    fetch(
      'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Structure_Affected.geojson',
    )
      .then((resp) => resp.json())
      .then((json) => {
        setStructureData(json);
      })
      .catch((err) => console.error('Could not load data', err));
  }, []);

  const data = useMemo(() => {
    return [allData, pointData, labelGeojson, structureData];
  }, [allData, pointData, labelGeojson, structureData]);

  const counstruction_boundary = useMemo(() => {
    return cboundaryData;
  }, [cboundaryData]);

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
  const filter_station = useMemo(
    () => ['in', 'Station1', stationSelected && stationSelected.field1],
    [stationSelected],
  );
  const filter_all = useMemo(() => ['!=', 'Id', true], [stationSelected]);

  // good sample for filtering
  // https://labs.mapbox.com/impact-tools/finder/
  // Zoom to bounds
  function zoomToLayer(search_property: any, zoom: any, data: any, search_value: any) {
    data?.features.forEach((feature: any) => {
      // if (feature.properties['Station1'].includes('Tandang Sora')) { // includes keyword
      //   console.log(feature);
      // }
      if (feature.properties[search_property] === search_value) {
        filteredGeojson.features.push(feature);
      }
    });

    if (filteredGeojson.features.length === 0) {
      return console.log('Your input does not exist.');
    } else {
      const [minLng, minLat, maxLng, maxLat] = bbox(filteredGeojson);
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 40, duration: 1000, zoom: zoom },
      );
    }
  }

  useEffect(() => {
    if (stationSelected && stationSelected.field1 !== 'All') {
      setChartData(updatechartData(data[0]?.features, stationSelected.field1));
      // Reset filtered geojson layer
      setFilteredGeojson(emptyFeatureCollection);
      zoomToLayer('Station1', 16, data[0], stationSelected.field1);
      //
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

  // Search and Zoom
  const handleSearch = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    if (inputValue) {
      setFilteredGeojson(emptyFeatureCollection);
      zoomToLayer('CN', 17, data[0], inputValue);
    }
  };

  // Legend
  // Land Acquisition: when legend is clicked
  const filter_lot_legend_all = useMemo(
    () => ['all', ['in', 'StatusNVS3', legendClickedValue], ['!=', 'Id', true]],
    [legendClickedValue, stationSelected],
  );

  const filter_lot_legend = useMemo(
    () => [
      'all',
      ['in', 'StatusNVS3', legendClickedValue],
      ['in', 'Station1', stationSelected && stationSelected.field1],
    ],
    [legendClickedValue, stationSelected],
  );

  // Land Acquisition: when layer toggle is clicked and resets
  const filter_lot_reset_all = useMemo(() => ['!=', 'Id', true], [resetLegendButton]);
  const filter_lot_reset = useMemo(
    () => [
      'all',
      ['>=', 'StatusNVS3', 0],
      ['in', 'Station1', stationSelected && stationSelected.field1],
    ],
    [resetLegendButton, stationSelected],
  );

  //
  useEffect(() => {
    if (legendClickedCategory) {
      const status_value = statusLotQuery.find(
        (emp: any) => emp.category === legendClickedCategory,
      ).value;
      setLegendClickedValue(status_value);
    }
  }, [legendClickedCategory]);

  // Affected Structure
  const filter_structure_legend_all = useMemo(
    () => ['all', ['in', 'height', legendStructureClickedValue], ['!=', 'Id', true]],
    [legendStructureClickedValue, stationSelected],
  );
  const filter_structure_legend = useMemo(
    () => [
      'all',
      ['in', 'height', legendStructureClickedValue],
      ['in', 'Station1', stationSelected && stationSelected.field1],
    ],
    [legendStructureClickedValue, stationSelected],
  );
  useEffect(() => {
    if (legendStructureClickedCategory) {
      const status_value = statusStructureQuery.find(
        (emp: any) => emp.category === legendStructureClickedCategory,
      ).value;
      setLegendStructureClickedValue(status_value);
    }
  }, [legendStructureClickedCategory]);

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

  // https://flowbite.com/blocks/application/shells/
  return (
    <div className="parent h-screen flex flex-col bg-[#555555]">
      {/* ---------------- Header -------------------------*/}
      <header
        id="header"
        className="flex items-stretch h-fit p-4 m-1 bg-[#2b2b2b] text-slate-100 text-3xl/10"
      >
        <img
          src="https://EijiGorilla.github.io/Symbols/Projec_Logo/OCG.svg"
          width={50}
          className="mr-1 -mb-1"
        />
        Land Acquisition (Sample)
        {/* Dropdown filter */}
        <div className="text-sm absolute right-20">
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

      {/*----------------- Three Frames -----------------*/}
      <div className="grid grid-cols-15/65/20 h-full mx-1 mb-1">
        {/* Legend */}
        <div>
          {/* Land Acquisition Layer */}
          <div id="state-legend" className="bg-[#2b2b2b] mr-1 mb-1">
            <div className="flex items-center mb-2">
              <input
                defaultChecked={true}
                id="checked-checkbox"
                type="checkbox"
                value=""
                onChange={(event) => setLotLayerToggle(event.target.checked)}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="ms-2 text-sm font-medium text-white-900 dark:text-gray-300">
                <b>Land Acquisition</b>
              </label>
            </div>
            {/* <h4 className="text-md text-center">Status of Land Acquisition</h4> */}
            {statusLotLabel.map((label: any, index: any) => {
              return (
                <div
                  key={index}
                  onClick={(event) => setLegendClickedCategory(event.currentTarget.innerText)}
                >
                  <span style={{ backgroundColor: statusLotColor[index] }}></span>
                  {label}
                </div>
              );
            })}
          </div>
          {/*  */}
          {/* Affected Structure */}
          <div id="state-legend" className="bg-[#2b2b2b] mr-1">
            <div className="flex items-center mb-2">
              <input
                defaultChecked={true}
                id="checked-checkbox"
                type="checkbox"
                value=""
                onChange={(event) => setStructureLayerToggle(event.target.checked)}
                className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label className="ms-2 text-sm font-medium text-white-900 dark:text-gray-300">
                <b>Affected Structure</b>
              </label>
            </div>
            {/* <h4 className="text-md text-center">Status of Land Acquisition</h4> */}
            {statusStructureLabel.map((label: any, index: any) => {
              return (
                <div
                  key={index}
                  onClick={(event) =>
                    setLegendStructureClickedCategory(event.currentTarget.innerText)
                  }
                >
                  <span style={{ backgroundColor: statusStructureColor[index] }}></span>
                  {label}
                </div>
              );
            })}
          </div>
          {/* <button
            onClick={(event) =>
              setResetLegendButton(resetLegendButton === 'unclicked' ? 'clicked' : 'unclicked')
            }
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
          >
            Button
          </button> */}
        </div>

        {/* Map Frame */}
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
            'structurePoly',
            'highlight-lot',
          ]}
          // https://docs.mapbox.com/api/maps/styles/
          mapStyle={'mapbox://styles/mapbox/dark-v11'}
        >
          {/* why use useMemo? */}
          {/* Construction Boundary Layer */}

          {/* Lot Layer */}
          <Source type="geojson" data={data[0]}>
            <Layer {...lotPolyStyle} id="lotPoly" />
            <Layer
              {...lotPolyStyle}
              filter={
                stationSelected && stationSelected.field1 === 'All' ? filter_all : filter_station
              }
              id="lotPoly"
              layout={{ visibility: lotLayerToggle ? 'visible' : 'none' }}
            />
            <Layer
              {...lotPolyStyle}
              filter={
                legendClickedValue && stationSelected && stationSelected.field1 !== 'All'
                  ? filter_lot_legend
                  : legendClickedValue && stationSelected && stationSelected.field1 === 'All'
                    ? filter_lot_legend_all
                    : filter_lot_legend_all
              }
              id="lotPoly"
            />
            {/* <Layer {...lotPolyStyle} filter={filter_lot_reset_all} id="lotPoly" /> */}
          </Source>
          <Source type="geojson" data={data[0]}>
            <Layer
              {...highlightedLotPolyStyle}
              filter={inputValue === undefined ? ['==', 'CN', ''] : ['==', 'CN', inputValue]}
              id="highlight-lot"
            />
          </Source>
          {/*  */}
          {/* Construction Boundary */}
          <Source type="geojson" data={counstruction_boundary}>
            <Layer {...cBoundaryPolyStyle} id="lotPolyBoundary" />
            <Layer
              {...cBoundaryPolyStyle}
              filter={
                stationSelected && stationSelected.field1 === 'All' ? filter_all : filter_station
              }
              id="lotPolyBoundary"
              key="boundaries"
              // layout={{ visibility: 'none' }}
            />
          </Source>
          {/* Station Point Layer */}
          <Source type="geojson" data={data[1]}>
            <Layer {...stationStyle} id="stationPt" />
            <Layer {...stationLabel} id="stationPtLabel" />
          </Source>
          {/* Lot Point Layer for Labels */}
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
          {/*  */}
          {/* Affected Structure Layer */}
          <Source type="geojson" data={data[3]}>
            <Layer {...structureStyle} id="structurePoly" />
            <Layer
              {...structureStyle}
              filter={
                stationSelected && stationSelected.field1 === 'All' ? filter_all : filter_station
              }
              layout={{ visibility: structureLayerToggle ? 'visible' : 'none' }}
              id="structurePoly"
            />
            <Layer
              {...structureStyle}
              filter={
                legendStructureClickedValue && stationSelected && stationSelected.field1 !== 'All'
                  ? filter_structure_legend
                  : legendStructureClickedValue &&
                      stationSelected &&
                      stationSelected.field1 === 'All'
                    ? filter_structure_legend_all
                    : filter_structure_legend_all
              }
              id="structurePoly"
            />
          </Source>

          {/* Popup */}
          {clickedInfo && (
            <div
              className="w-30 h-10 absolute z-99 bg-white p-3 pt-1 rounded-md"
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
          {/* Search Widget */}
          <form className="max-w-sm ml-auto">
            <label
              // for="default-search"
              className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none bg-dark-700">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="search"
                id="default-search"
                className="block w-3/4 p-4 ps-10 text-sm text-white border border-[#949494] rounded-lg bg-[#2b2b2b] focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-500 dark:focus:border-gray-500"
                placeholder="Search CN for Lots..."
                required
                onChange={(event) => setInputValue(event.target.value)}
              />
              <button
                type="submit"
                className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </form>
        </Map>

        {/* Chart Frame */}
        <div className="bg-[#2b2b2b] ml-1">
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <ul
              className="flex flex-wrap -mb-px text-sm font-medium text-center"
              id="default-styled-tab"
              data-tabs-toggle="#default-styled-tab-content"
              data-tabs-active-classes="text-white hover:text-white-600 dark:text-white-500 dark:hover:text-white-500 border-blue-500 dark:border-white-500"
              data-tabs-inactive-classes="dark:border-transparent text-gray-500 hover:text-gray-400 dark:text-gray-400 border-gray-100 hover:border-blue-500 dark:border-gray-700 dark:hover:text-gray-300"
              role="tablist"
            >
              <li className="me-2" role="presentation">
                <button
                  className="inline-block p-4 border-b-2 rounded-t-lg"
                  id="profile-styled-tab"
                  data-tabs-target="#styled-profile"
                  type="button"
                  role="tab"
                  aria-controls="profile"
                  aria-selected="false"
                >
                  Land
                </button>
              </li>
              <li className="me-2" role="presentation">
                <button
                  className="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  id="dashboard-styled-tab"
                  data-tabs-target="#styled-dashboard"
                  type="button"
                  role="tab"
                  aria-controls="dashboard"
                  aria-selected="false"
                >
                  Structures
                </button>
              </li>
              <li className="me-2" role="presentation">
                <button
                  className="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  id="settings-styled-tab"
                  data-tabs-target="#styled-settings"
                  type="button"
                  role="tab"
                  aria-controls="settings"
                  aria-selected="false"
                >
                  Expropri List
                </button>
              </li>
            </ul>
          </div>
          <div id="default-styled-tab-content">
            <div
              // className="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              id="styled-profile"
              role="tabpanel"
              aria-labelledby="profile-tab"
            >
              <LotChart data={chartData} station={stationSelected} />
              {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                This is some placeholder content the{' '}
                <strong className="font-medium text-gray-800 dark:text-white">
                  Profile tab's associated content
                </strong>
                . Clicking another tab will toggle the visibility of this one for the next. The tab
                JavaScript swaps classes to control the content visibility and styling.
              </p> */}
            </div>
            <div
              className="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              id="styled-dashboard"
              role="tabpanel"
              aria-labelledby="dashboard-tab"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This is some placeholder content the{' '}
                <strong className="font-medium text-gray-800 dark:text-white">
                  Dashboard tab's associated content
                </strong>
                . Clicking another tab will toggle the visibility of this one for the next. The tab
                JavaScript swaps classes to control the content visibility and styling.
              </p>
            </div>
            <div
              className="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              id="styled-settings"
              role="tabpanel"
              aria-labelledby="settings-tab"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This is some placeholder content the{' '}
                <strong className="font-medium text-gray-800 dark:text-white">
                  Settings tab's associated content
                </strong>
                . Clicking another tab will toggle the visibility of this one for the next. The tab
                JavaScript swaps classes to control the content visibility and styling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
