'use client';
import { createClient } from "@libsql/client";
import { useEffect } from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue, Button} from "@nextui-org/react";
import { useState } from "react";
import React from "react";
import { TestResult } from "@/components/testResult";
import { fixedMaskingConfigs } from "@/config/masking";


const client = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || "",
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
});

interface TestDataProps {
  id: number;
  name: string;
  testType: string;
  gridType: string;
  advancedSettings: any;
  grid: number[];
  responses: number[];
  calibrationGain: number;
  maskerInfo: {
    placement: number;
    gain: number
  }
}


export default function StatsPage() {
  const [testData, setTestData] = useState<any>([]);
  const [selectedGains, setSelectedGains] = useState<number[]>([]);
  const [grid, setGrid] = useState<number[]>([]);
  const [gridType, setGridType] = useState<string>("");
  const [advancedSettings, setAdvancedSettings] = useState<any>({});
  const [maskerInfo, setMaskerInfo] = useState<any>({});
  const [minGain, setMinGain] = useState<number>(0);
  const [formattedTableRows, setFormattedTableRows] = useState<any>([]);
  const [hasData, setHasData] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const maskingTypes: Record<string, Record<string, { title: string; masker: string; maskee: string }>> = fixedMaskingConfigs['maskingTypes'];
  console.log(maskingTypes)

  useEffect(() =>{
    client.execute("SELECT * FROM test_results").then((result) => {
      const newFormattedTableRows = result.rows.map((row: any) => {
        return {
          id: row.id,
          name: row.name,
          testType: row.testType,
          gridType: row.gridType,
          advancedSettings: JSON.parse(row.advancedSettings),
          grid: JSON.parse(row.grid),
          responses: JSON.parse(row.responses),
          calibrationGain: row.calibrationGain,
          maskerInfo: JSON.parse(row.maskerInfo)
          
        }
      })
      console.log(newFormattedTableRows)
      setFormattedTableRows(newFormattedTableRows);
    } )
    
  }
  ,[])

  useEffect(() => {
    console.log(testData)
  }
  ,[testData])

  return (
    <div className='flex flex-row items-center justify-center gap-4 py-8 md:py-10 w-[80vw] h-[80vh]'>
      <div className="flex flex-col w-1/2">
        <Table
          className="w-full"
        >
          <TableHeader>
            <TableColumn>id</TableColumn>
            <TableColumn>Name</TableColumn>
            <TableColumn>Masking domain</TableColumn>
            <TableColumn>Selected test</TableColumn>
            <TableColumn>Curve</TableColumn>
          </TableHeader>
          <TableBody>
            {formattedTableRows.map((row: TestDataProps, index: number) => (
              <TableRow
                key={index}
                
                
              >
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.gridType == 'time'? 'Time': "Frequency"}</TableCell>
                <TableCell>{maskingTypes[row.gridType][row.testType].title}</TableCell>
                <TableCell>
                  <Button onPress={() => {
                    console.log(row.gridType);
                    setSelectedGains(row.responses);
                    setGrid(row.grid);
                    setGridType(row.gridType);
                    setAdvancedSettings(row.advancedSettings);
                    setMaskerInfo(row.maskerInfo);
                    setMinGain(row.calibrationGain);
                    setSelectedIndex(index);
                  }}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button 
            className="mt-4"
            onPress={() => {
              const csvHeader = ['id', 'name', 'testType', 'gridType', 'responses', 'grid', 'calibrationGain', 'maskerPlacement', 'maskerGain', 'advancedSettings'].join('|');
              const csv = formattedTableRows.map((row: TestDataProps) => {
                return [row.id, row.name, maskingTypes[row.gridType][row.testType].title, row.gridType == 'time'? 'Time': "Frequency", JSON.stringify(row.responses), JSON.stringify(row.grid), row.calibrationGain, row.maskerInfo.placement, row.maskerInfo.gain, JSON.stringify(row.advancedSettings)].join('|');
              }).join('\n');
              const blob = new Blob([csvHeader + '\n' + csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.setAttribute('hidden', '');
              a.setAttribute('href', url);
              a.setAttribute('download', 'test_results.csv');
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
          Export all data to CSV
        </Button>
      </div>

      {selectedIndex>=0 && <TestResult selectedGains={selectedGains} grid={grid} gridType={gridType} maskerInfo={maskerInfo} minGain={minGain}/>}
    </div>
  );
}
