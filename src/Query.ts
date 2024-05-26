import { statusLotLabel, statusLotQuery } from './statusUniqueValues';
import * as am5 from '@amcharts/amcharts5';

export function uniqueValue(arr: any) {
  let outputArray = Array.from(new Set(arr));
  return outputArray;
}

export function addDropdown(arr: any, elem: any) {
  if (arr.indexOf(elem) !== -1) {
    return arr;
  }
  arr.push(elem);
  return arr;
}

export const updatechartData = (dataObj: any, station: any) => {
  let status_all: any = [];
  if (station === 'All') {
    dataObj?.map((property: any, index: any) => {
      if (property.properties && property.properties.StatusNVS3) {
        status_all.push(property.properties.StatusNVS3);
      }
    });
  } else {
    // const filtered_data = dataObj.filter((a: any) => a.properties.Station1 === station);
    dataObj?.map((property: any, index: any) => {
      // if (property.properties && property.properties.StatusNVS3) {
      //   console.log(property.properties.StatusNVS3);
      //   status_all.push(property.properties.StatusNVS3);
      // }
      if (property.properties && property.properties['Station1'] === station) {
        status_all.push(property.properties.StatusNVS3);
      }
    });
  }

  // Count for each status
  let counts: any = {};
  status_all.forEach((x: any) => {
    counts[x] = (counts[x] || 0) + 1;
  });

  // Total number of lots with status
  const length_non_null = status_all.filter((el: any) => {
    return el != null;
  });

  // compiling for chart
  const chartArray = statusLotLabel.map((status: any, index: any) => {
    return Object.assign({
      category: status,
      value: counts[index + 1] ? counts[index + 1] : 0,
      sliceSettings: {
        fill: am5.color(statusLotQuery[index].color),
      },
    });
  });

  return [length_non_null.length, chartArray];
};
