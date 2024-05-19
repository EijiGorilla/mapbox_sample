import type { FillLayer, LineLayer } from 'mapbox-gl';
import { statusLotColor } from './statusUniqueValues';

// For more information on data-driven styles, see https://www.mapbox.com/help/gl-dds-ref/
export const dataLayerFill: FillLayer = {
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
