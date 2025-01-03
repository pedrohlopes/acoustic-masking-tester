"use client";

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Frequency (Hz)',
      }
    },
    y: {
      title: {
        display: true,
        text: 'Gain (dB SPL)',
      }
    }
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Your masking curve',
    },
    tooltip: {
      callbacks: {
          label: function(context: any) {
              let label = context.dataset.label.slice(0,-1) || '';
              if (label) {
                  label += ': ';
              }
              if (context.parsed.y !== null) {
                  label += context.parsed.y + ' dB SPL';
              }
              return label;
          },
          title: function(context: any) {
            return context[0].label + ' Hz';
          }
      }
    }
  },
  elements: {
    point: {
      radius: 5,
    },
  },
};

const labels = ['january', 'february', 'march', 'april', 'may', 'june', 'july'];

import { ChartData, ChartDataset } from 'chart.js';

export const data: ChartData<'line'> = {
  labels,
  datasets: [
    {
      data: labels.map(() => 100 * Math.random()) as number[],
      label: 'Maskees',
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
    },
    {
      data: [{ x: 0, y: 0 }] as { x: number; y: number }[],
      label: 'Masker',
      borderColor: 'rgb(53, 162, 235)',
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    },
  ],
};

interface MaskerInfo {
  placement: number;
  gain: number;
}

interface TestResultProps {
  selectedGains: number[];
  grid: number[];
  gridType: string;
  maskerInfo: MaskerInfo;
  minGain: number;
}






export const TestResult = ({ selectedGains, grid,gridType, maskerInfo, minGain }: TestResultProps) => {
  

  const [plotData, setPlotData] = useState(data);
  const [plotOptions, setPlotOptions] = useState(options);




  useEffect(() => {
    setPlotData({
      labels: grid,
      datasets: [
        {
          type: 'line',
          label: 'Maskees',
          data: selectedGains,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
        {
          type: 'line',
          label: 'Masker',
          data: [{x: maskerInfo.placement, y: maskerInfo.gain - minGain}, {x: maskerInfo.placement, y: 0}],
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        }
        
      ],
    });
    setPlotOptions({
      ...options,
      
      scales: {
        ...options.scales,
        x: {
          title: {
            display: true,
            text: gridType == 'time'? 'Time (s)': 'Frequency (Hz)',
          }
        }
      },
      plugins: {
        ...options.plugins,
        tooltip: {
          callbacks: {
              label: function(context: any) {
                  let label = context.dataset.label.slice(0,-1) || '';
                  if (label) {
                      label += ': ';
                  }
                  if (context.parsed.y !== null) {
                      label += context.parsed.y + ' dB SPL';
                  }
                  return label;
              },
              title: function(context: any) {
                return context[0].label + (gridType == 'time'? ' s': ' Hz');
              }
          }
        }
      }
    });

  }, [selectedGains, grid, gridType, maskerInfo, minGain]);
  
  return (
      <div className="w-full h-full">
        <Line options={plotOptions} data={plotData}/>
      </div>
  );
};
