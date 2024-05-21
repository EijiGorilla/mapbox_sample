import type { FillLayer, LineLayer, Layer, SymbolLayer, CircleLayer } from 'mapbox-gl';
import { statusLotColor } from './statusUniqueValues';

// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
// Lot polygon style
export const lotPolyStyle: FillLayer = {
  id: 'data',
  type: 'fill',
  //   filter: ['==', 'class', 'park'],
  paint: {
    'fill-color': {
      property: 'StatusNVS3',
      default: '#fff5eb',
      stops: [
        [1, statusLotColor[0]],
        [2, statusLotColor[1]],
        [3, statusLotColor[2]],
        [4, statusLotColor[3]],
        [5, statusLotColor[4]],
        [6, statusLotColor[5]],
        [7, statusLotColor[6]],
      ],
    },
    'fill-opacity': 0.8,
    'fill-outline-color': '#36454f',
  },
};

export const dataLayerLine: LineLayer = {
  id: 'dataLine',
  type: 'line',
  layout: {},
  paint: {
    'line-width': 3,
  },
};

// Station point style
export const stationLabel: SymbolLayer = {
  id: 'labelTextLayer',
  type: 'symbol',
  // source: textGeoJsonSource,
  paint: {
    'text-color': '#0000FF', //Color of your choice
    'text-halo-blur': 5,
    'text-halo-color': '#ffffff',
    'text-halo-width': 1,
    'text-opacity': 1,
  },
  layout: {
    'text-field': ['get', 'Station'], //This will get "t" property from your geojson
    // 'text-font': textFontFamily,
    'text-rotation-alignment': 'auto',
    'text-allow-overlap': true,
    'text-anchor': 'top',
    'text-size': 12,
    'text-line-height': 1,
    'text-offset': [0, 0],
  },
};

export const stationStyle: CircleLayer = {
  id: 'data',
  type: 'circle',
  //   filter: ['==', 'class', 'park'],
  paint: {
    'circle-color': '#000000',
    'circle-radius': 2,
  },
};

// Lot labels using point
export const lotPtStyle: CircleLayer = {
  id: 'labelPoint',
  type: 'circle',
  //   filter: ['==', 'class', 'park'],
  paint: {
    'circle-color': '#000000',
    'circle-radius': 0,
  },
};

export const lotPtLabel: SymbolLayer = {
  id: 'labelTextLayer',
  type: 'symbol',
  // source: textGeoJsonSource,
  paint: {
    'text-color': '#000000', //Color of your choice
    // 'text-halo-blur': 5,
    // 'text-halo-color': '#ffffff',
    // 'text-halo-width': 1,
    'text-opacity': 1,
  },
  layout: {
    'text-field': ['get', 'Id'], //This will get "t" property from your geojson
    // 'text-font': textFontFamily,
    'text-rotation-alignment': 'auto',
    'text-allow-overlap': true,
    'text-anchor': 'top',
    'text-size': 10,
    'text-line-height': 1,
    'text-offset': [0, 0],
  },
};
