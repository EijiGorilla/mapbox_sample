import { useEffect, useRef, useState } from 'react';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter';
import Query from '@arcgis/core/rest/support/Query';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Responsive from '@amcharts/amcharts5/themes/Responsive';

import '../App.css';
// import { generateLotData, generateLotNumber, thousands_separators } from '../Query';
// import { statusLotMoaQuery, statusLotQuery } from '../StatusUniqueValues';

// Dispose function
function maybeDisposeRoot(divId: any) {
  am5.array.each(am5.registry.rootElements, function (root) {
    if (root.dom.id === divId) {
      root.dispose();
    }
  });
}

///*** Others */
/// Draw chart
const LotChart = (props: any) => {
  // 1. Land Acquisition
  const pieSeriesRef = useRef<unknown | any | undefined>({});
  const legendRef = useRef<unknown | any | undefined>({});
  const chartRef = useRef<unknown | any | undefined>({});
  const [lotData, setLotData] = useState([
    {
      category: String,
      value: Number,
      sliceSettings: {
        fill: am5.color('#00c5ff'),
      },
    },
  ]);

  const chartID = 'pie-two';
  ///
  const [lotNumber, setLotNumber] = useState([]);
  const [handedOverPteNumber, setHandedOverPteNumber] = useState([]);

  //   console.log(props.data);
  useEffect(() => {
    if (props.data) {
      setLotData(props.data);
    }
  }, [props.station, props.data]);

  // 1. Pie Chart for Land Acquisition
  useEffect(() => {
    // Dispose previously created root element

    maybeDisposeRoot(chartID);

    var root = am5.Root.new(chartID);
    root.container.children.clear();
    root._logo?.dispose();

    // Set themesf
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root), am5themes_Responsive.new(root)]);

    // Create chart
    // https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/
    var chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
      }),
    );
    chartRef.current = chart;

    // Create series
    // https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Series
    var pieSeries = chart.series.push(
      am5percent.PieSeries.new(root, {
        name: 'Series',
        categoryField: 'category',
        valueField: 'value',
        //legendLabelText: "[{fill}]{category}[/]",
        // legendValueText: '',
        radius: am5.percent(45), // outer radius
        innerRadius: am5.percent(30),
        scale: 1.9,
      }),
    );
    pieSeriesRef.current = pieSeries;
    chart.series.push(pieSeries);

    // values inside a donut
    let inner_label = pieSeries.children.push(
      am5.Label.new(root, {
        text: '[#ffffff]{valueSum}[/]\n[fontSize: 7px; #d3d3d3; verticalAlign: super]TOTAL LOTS[/]',
        fontSize: 25,
        centerX: am5.percent(50),
        centerY: am5.percent(40),
        populateText: true,
        oversizedBehavior: 'fit',
        textAlign: 'center',
      }),
    );

    pieSeries.onPrivate('width', (width: any) => {
      inner_label.set('maxWidth', width * 0.7);
    });

    // Set slice opacity and stroke color
    pieSeries.slices.template.setAll({
      fillOpacity: 0.9,
      stroke: am5.color('#ffffff'),
      strokeWidth: 0.5,
      strokeOpacity: 1,
      templateField: 'sliceSettings',
    });

    // Disabling labels and ticksll
    pieSeries.labels.template.set('visible', false);
    pieSeries.ticks.template.set('visible', false);

    pieSeries.data.setAll(lotData);

    // Legend
    // https://www.amcharts.com/docs/v5/charts/percent-charts/legend-percent-series/
    var legend = chart.children.push(
      am5.Legend.new(root, {
        // layout: am5.GridLayout.new(root, {
        //   maxColumns: 2,
        //   // fixedWidthGrid: true,
        // }),
        layout: root.verticalLayout,
      }),
    );

    legendRef.current = legend;
    legend.data.setAll(pieSeries.dataItems);

    // Change the size of legend markers
    legend.markers.template.setAll({
      width: 15,
      height: 15,
      marginLeft: 30,
    });

    // Change the marker shape
    legend.markerRectangles.template.setAll({
      cornerRadiusTL: 10,
      cornerRadiusTR: 10,
      cornerRadiusBL: 10,
      cornerRadiusBR: 10,
    });

    // Responsive legend
    // https://www.amcharts.com/docs/v5/tutorials/pie-chart-with-a-legend-with-dynamically-sized-labels/
    // This aligns Legend to Left
    // chart.onPrivate('width', function (width: any) {
    //   const boxWidth = 190; //props.style.width;
    //   var availableSpace = Math.max(width - chart.height() - boxWidth, boxWidth);
    //   //var availableSpace = (boxWidth - valueLabelsWidth) * 0.7
    //   legend.labels.template.setAll({
    //     width: availableSpace,
    //     maxWidth: availableSpace,
    //   });
    // });

    // To align legend items: valueLabels right, labels to left
    // 1. fix width of valueLabels
    // 2. dynamically change width of labels by screen size

    // Change legend labelling properties
    // To have responsive font size, do not set font size
    legend.labels.template.setAll({
      oversizedBehavior: 'truncate',
      fill: am5.color('#ffffff'),
      textAlign: 'left',
      //textDecoration: "underline"
      // width: am5.percent(100),

      // fontWeight: '100',
    });

    legend.valueLabels.template.set('forceHidden', true);

    // legend.valueLabels.template.setAll({
    //   textAlign: 'left',
    //   width: am5.percent(100),
    //   fill: am5.color('#ffffff'),
    // });

    legend.itemContainers.template.setAll({
      // set space between legend items
      paddingTop: 3,
      paddingBottom: 1,
    });

    pieSeries.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartID, lotData]);

  useEffect(() => {
    pieSeriesRef.current?.data.setAll(lotData);
    legendRef.current?.data.setAll(pieSeriesRef.current.dataItems);
  });

  return (
    <>
      {/* Total Lot Number */}
      <div>
        {/* <div>
          <span className="bg-green-100 text-green-800 text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md dark:bg-green-900 dark:text-green-300">
            <svg
              className="w-2.5 h-2.5 me-1.5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 10 14"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13V1m0 0L1 5m4-4 4 4"
              />
            </svg>
            42.5%
          </span>
        </div> */}
        <div className="grid grid-cols-3 items-center justify-center border-b border-gray-600 ml-2 mr-2 pb-5">
          {/* if add numbers beside the label, <dl className="flex items-center"></dl> */}
          <div className="w-14 h-14 border border-gray-500 p-1 rounded-lg bg-gray-800 dark:bg-gray-700 flex items-center justify-center me-3">
            <img
              src="https://EijiGorilla.github.io/Symbols/Land_Acquisition.svg"
              alt="Land Logo"
              height={'100%'}
              width={'100%'}
            />
          </div>
          <dl className="items-center">
            <dt className=" text-base font-normal text-gray-400 dark:text-gray-400 pb-1">
              Handed Over
            </dt>
            <dd className="leading-none text-3xl font-bold text-gray-300 dark:text-white">
              {props.total - 10}
            </dd>
          </dl>
          <dl className="items-center justify-end">
            <dt className="ml-5 text-base font-normal text-gray-400 dark:text-gray-400 pb-1">
              Paid
            </dt>
            <dd className="ml-5 leading-none text-3xl font-bold text-gray-300 dark:text-white">
              59
            </dd>
          </dl>
        </div>
      </div>
      {/* Lot Chart */}
      <div
        id={chartID}
        style={{
          height: '50vh',
          backgroundColor: 'rgb(0,0,0,0)',
          color: 'white',
          marginTop: '10px',
        }}
      ></div>
    </>
  );
}; // End of lotChartgs

export default LotChart;
