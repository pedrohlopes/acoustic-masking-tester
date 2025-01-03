'use client';
import { subtitle, title } from "@/components/primitives";
import React, { useEffect, useState } from "react";
import { Button, Input} from "@nextui-org/react";
import {CheckboxGroup, Checkbox} from "@nextui-org/checkbox";
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

const randomSeed = 51;







export default function TestsPage() {
  const [invalidMasker,setInvalidMasker] = React.useState(false);
  const [invalidMaskee,setInvalidMaskee] = React.useState(false);
  const [invalidMaskingType, setInvalidMaskingType] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState(["pulse"]);
  const [selectedMaskingType, setSelectedMaskingType] = React.useState(["time"]);
  const [userResponses, setUserResponses] = React.useState<number[]>([]);
  const [calibrationGain,setCalibrationGain] = React.useState(0);
  const [stage,setStage] = React.useState(0);
  const [testComplete,setTestComplete] = React.useState(false);
  const maskingTypes: Record<string, Record<string, { title: string; masker: string; maskee: string }>> = fixedMaskingConfigs['maskingTypes'];


  const [testSettings, setTestSettings] = React.useState<TestSettings>(defaultTestSettings);
  const [grid, setGrid] = React.useState<number[]>([]);
  const [userName, setUserName] = React.useState<string>("");



  console.log(selectedTest)
  useEffect(() => {
    const newGrid = getGridFromSizeStepAndCenter(testSettings.gridSize,
                                                  selectedMaskingType[0] == 'time'? testSettings.timeStep: testSettings.frequencyStep,
                                                  selectedMaskingType[0] == 'time' ? testSettings.maskerLocation: testSettings.maskerFrequency);
    setGrid(newGrid);
  }, [testSettings.gridSize, testSettings.timeStep, testSettings.frequencyStep,selectedMaskingType, testSettings.maskerLocation]);

  


  const handleTestEnd = (savedGains: number[]) => {
    
    setUserResponses(savedGains);
    setTimeout(() => setTestComplete(true), 500);
  }

  
  return (
    <div>
      <h1 className={title()}>Masking tests</h1>
      {!stage && !testComplete && <p className="mt-4 mb-4"> Welcome to the masking tests!
      </p>}

      { 
      testComplete ? (
        <TestResults selectedGains={userResponses} grid={grid} gridType={selectedMaskingType[0]}
        maskerInfo={{
          placement: selectedMaskingType[0] == 'time'? testSettings.maskerLocation: testSettings.maskerFrequency,
          gain: testSettings.maskerLevel
        }}
        minGain={calibrationGain}
        />
      ) : 
      stage == 0 ? (
        <div className="flex flex-col items-center justify-center">
          <p className='text-md text-black dark:text-white mb-4'>Please enter your name below to start:</p>
          <Input placeholder="Your name" onChange={(e) => setUserName(e.target.value)} />
          <Button
            className={buttonStyles({color: "primary"})}
            style={{marginTop: "1rem"}}
            onPress={() => {
              setStage(1);
            }}
          >
            Begin test
          </Button>
        </div>

      ) :

      stage == 1 ? (
        <CalibrationStage testSettings={testSettings} setTestSettings={setTestSettings} onCalibrated={(gain) => {setStage(2); setCalibrationGain(gain);}} />
  
      ) :
      (stage == 2   ? (<>
      
      <div className="flex flex-col items-center justify-center">
        <p className="mt-4">Finally, select the masking test you would like to try:</p>
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
      </div>
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
            style={{marginTop: "2rem"}}
            onPress={() => {
              if (selectedTest.length < 1) {
                setInvalidMasker(true);
              }
              if (selectedMaskingType.length < 1) {
                setInvalidMaskingType(true);
              }
              if (selectedTest.length > 0 && selectedMaskingType.length > 0) {
                setStage(3);
              }
            }}
          >
            Begin test
      </Button>
      </>
      ) : (
        <MaskingTest maskerType={maskingTypes[selectedMaskingType[0]][selectedTest[0]]['masker']}
          maskeeType={maskingTypes[selectedMaskingType[0]][selectedTest[0]]['maskee']} 
          maskingType={selectedMaskingType[0]} minGain={calibrationGain}
          advancedSettings={testSettings} 
          onTestEnd={handleTestEnd} />
      ))}
    </div>
  );
}
