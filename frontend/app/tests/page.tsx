'use client';
import { subtitle, title } from "@/components/primitives";
import React from "react";
import {CheckboxGroup, Checkbox, Button} from "@nextui-org/react";
import {button as buttonStyles} from "@nextui-org/theme";
import {MaskingTest} from "@/components/maskingTest";
import { CalibrationStage } from "@/components/calibration";
import { fixedMaskingConfigs } from "@/config/masking";
import { TestResults } from "@/components/testResults";

export default function TestsPage() {
  const [invalidMasker,setInvalidMasker] = React.useState(false);
  const [invalidMaskee,setInvalidMaskee] = React.useState(false);
  const [invalidMaskingType, setInvalidMaskingType] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState(["pulse"]);
  const [selectedMaskingType, setSelectedMaskingType] = React.useState(["time"]);
  const [calibrated,setCalibrated] = React.useState(false);
  const [calibrationGain,setCalibrationGain] = React.useState(0);
  const [stage,setStage] = React.useState(0);
  const [testComplete,setTestComplete] = React.useState(false);
  const maskingTypes = fixedMaskingConfigs['maskingTypes'];

  
  return (
    <div>
      <h1 className={title()}>Masking tests</h1>
      {!stage && !testComplete && <p className="mt-4 mb-4">
        Start by calibrating your audio output device. Then, select the masker, maskee, and masking type to begin the test.
      </p>}

      { !calibrated ? (
        <CalibrationStage onCalibrated={(gain) => {setCalibrated(true); setCalibrationGain(gain)}} />
  
      )
      :

      testComplete ? (
        <TestResults selectedGains={[-30,-20,-10,0,-10,-20,-30]} grid={[0,1,2,3,4,5,6]} />
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

          <CheckboxGroup
            isRequired
            isInvalid={invalidMasker}
            label="Select masker"
            orientation="horizontal"
            value={selectedTest}
            className="mt-4"
            onValueChange={(value) => {
              setInvalidMasker(value.length < 1);
              console.log(value);
              setSelectedTest([...value.slice(-1)]);
            }}
          >
            {selectedMaskingType[0] && Object.keys(maskingTypes[selectedMaskingType[0]]).map((masker) => (
              <Checkbox key={masker} value={masker}>
                {maskingTypes[selectedMaskingType[0]][masker].title}
              </Checkbox>
            ))}
          </CheckboxGroup>

          
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
        <MaskingTest maskerType={maskingTypes[selectedMaskingType[0]]['masker']} maskeeType={maskingTypes[selectedMaskingType[0]]['maskee']} maskingType={selectedMaskingType[0]} minGain={calibrationGain} onTestEnd={() => setTestComplete(true)} />
      ))}
    </div>
  );
}
