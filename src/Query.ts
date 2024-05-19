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
