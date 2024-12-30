'use client';
import { subtitle, title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import {CheckboxGroup, Checkbox, Button} from "@nextui-org/react";
import {button as buttonStyles} from "@nextui-org/theme";
import {MaskingTest} from "@/components/maskingTest";
import { CalibrationStage } from "@/components/calibration";
import { fixedMaskingConfigs } from "@/config/masking";
import { TestResults } from "@/components/testResults";
import { TestSettings, defaultTestSettings } from "@/components/settingsModal";

const getGridFromSizeStepAndCenter = (size: number, step: number, center: number) => {
  const grid = [];
  for (let i = 0; i < size; i++) {
    grid.push(center + (i - Math.floor(size / 2)) * step);
  }
  return grid;
}


export default function TestsPage() {
  const [invalidMasker,setInvalidMasker] = React.useState(false);
  const [invalidMaskee,setInvalidMaskee] = React.useState(false);
  const [invalidMaskingType, setInvalidMaskingType] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState(["pulse"]);
  const [selectedMaskingType, setSelectedMaskingType] = React.useState(["time"]);
  const [userResponses, setUserResponses] = React.useState<number[]>([]);
  const [calibrated,setCalibrated] = React.useState(false);
  const [calibrationGain,setCalibrationGain] = React.useState(0);
  const [stage,setStage] = React.useState(0);
  const [testComplete,setTestComplete] = React.useState(false);
  const maskingTypes = fixedMaskingConfigs['maskingTypes'];
  const [testSettings, setTestSettings] = React.useState<TestSettings>(defaultTestSettings);
  const [grid, setGrid] = React.useState<number[]>([]);
  console.log(selectedTest)
  useEffect(() => {
    const newGrid = getGridFromSizeStepAndCenter(testSettings.gridSize, testSettings.gridStep, testSettings.maskerLocation);
    setGrid(newGrid);
  }, [testSettings.gridSize, testSettings.gridStep, testSettings.maskerLocation]);

  


  const handleTestEnd = (savedGains: number[]) => {
    
    setUserResponses(savedGains);
    console.log(savedGains);
    console.log(grid);
    console.log(testSettings);
    console.log(calibrationGain);
    console.log(testSettings.maskerLevel - calibrationGain);
    setTimeout(() => setTestComplete(true), 500);
  }

  
  return (
    <div>
      <h1 className={title()}>Masking tests</h1>
      {!stage && !testComplete && <p className="mt-4 mb-4">
        Start by calibrating your audio output device. Then, select the masker, maskee, and masking type to begin the test.
      </p>}

      { !calibrated ? (
        <CalibrationStage testSettings={testSettings} setTestSettings={setTestSettings} onCalibrated={(gain) => {setCalibrated(true); setCalibrationGain(gain);}} />
  
      )
      :

      testComplete ? (
        <TestResults selectedGains={userResponses} grid={grid} 
        maskerInfo={{
          placement: testSettings.maskerLocation,
          gain: testSettings.maskerLevel
        }}
        minGain={calibrationGain}
        />
      ) : 
      (stage == 0   ? (<>
      

      <CheckboxGroup
        isRequired
        isInvalid={invalidMaskingType}
        label="Select masking type"
        orientation="horizontal"
        value={selectedMaskingType}
        className="mt-4 flex items-center justify-center content-center gap-2"
        onValueChange={(value) => {
          setInvalidMaskingType(value.length < 1);
          setSelectedMaskingType([...value.slice(-1)]);
        }}
      >
        <Checkbox value="time">Time</Checkbox>
        <Checkbox value="frequency">Frequency</Checkbox>


      </CheckboxGroup>

      {selectedMaskingType && (
          <div className="flex flex-col items-center justify-center text-center">
          <CheckboxGroup
            isRequired
            isInvalid={invalidMasker}
            label="Select masker"
            orientation="horizontal"
            value={selectedTest}
            className="mt-4 flex items-center justify-center content-center gap-2 text-center"
            onValueChange={(value) => {
              setInvalidMasker(value.length < 1);
              console.log(value);
              setSelectedTest([...value.slice(-1)]);
            }}
          >
            {selectedMaskingType[0] && Object.keys(maskingTypes[selectedMaskingType[0]]).map((masker) => (
              <Checkbox key={masker} value={masker} className="flex items-center content-center justify-center text-center">
                {maskingTypes[selectedMaskingType[0]][masker].title}
              </Checkbox>
            ))}
          </CheckboxGroup>

          </div>
      )}
      <Button
            className={buttonStyles({color: "primary"})}
            style={{marginTop: "1rem"}}
            onClick={() => {
              if (selectedTest.length < 1) {
                setInvalidMasker(true);
              }
              if (selectedMaskingType.length < 1) {
                setInvalidMaskingType(true);
              }
              if (selectedTest.length > 0 && selectedMaskingType.length > 0) {
                setStage(1);
              }
            }}
          >
            Begin test
      </Button>
      </>
      ) : (
        <MaskingTest maskerType={maskingTypes[selectedMaskingType[0]][selectedTest]['masker']}
          maskeeType={maskingTypes[selectedMaskingType[0]][selectedTest]['maskee']} 
          maskingType={selectedMaskingType[0]} minGain={calibrationGain}
          advancedSettings={testSettings} 
          onTestEnd={handleTestEnd} />
      ))}
    </div>
  );
}
