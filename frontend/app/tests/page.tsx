'use client';
import { subtitle, title } from "@/components/primitives";
import React from "react";
import {CheckboxGroup, Checkbox, Button} from "@nextui-org/react";
import {button as buttonStyles} from "@nextui-org/theme";
import {TestInterface} from "@/components/testInterface";
import { CalibrationStage } from "@/components/calibration";

export default function TestsPage() {
  const [invalidMasker,setInvalidMasker] = React.useState(false);
  const [invalidMaskee,setInvalidMaskee] = React.useState(false);
  const [invalidMaskingType, setInvalidMaskingType] = React.useState(false);
  const [selectedMasker, setSelectedMasker] = React.useState(["pulse"]);
  const [selectedMaskee, setSelectedMaskee] = React.useState(["pulse"]);
  const [selectedMaskingType, setSelectedMaskingType] = React.useState(["time"]);
  const [calibrated,setCalibrated] = React.useState(false);
  const [calibrationGain,setCalibrationGain] = React.useState(0);
  const [stage,setStage] = React.useState(0);
  return (
    <div>
      <h1 className={title()}>Masking tests</h1>
      <p className="mt-2 mb-8">
        Start by calibrating your audio output device. Then, select the masker, maskee, and masking type to begin the test.
      </p>

      { !calibrated ? (
        <CalibrationStage onCalibrated={(gain) => {setCalibrated(true); setCalibrationGain(gain)}} />
  
      )
      :
      
      (stage == 0   ? (<>
      <CheckboxGroup
        isRequired
        isInvalid={invalidMasker}
        label="Select masker type"
        orientation="horizontal"
        className="mt-4"
        value={selectedMasker}
        onValueChange={(value) => {
          setInvalidMasker(value.length < 1);
          setSelectedMasker([...value.slice(-1)]);
        }}
      >
        <Checkbox value="pulse">Pulse</Checkbox>
        <Checkbox value="tone">Tone</Checkbox>
        <Checkbox value="noise">Noise</Checkbox>


      </CheckboxGroup>
      <CheckboxGroup
        isRequired
        isInvalid={invalidMaskee}
        label="Select maskee type"
        orientation="horizontal"
        className="mt-4"
        value={selectedMaskee}
        onValueChange={(value) => {
          setInvalidMaskee(value.length < 1);
          setSelectedMaskee([...value.slice(-1)]);

        }}
      >
        <Checkbox value="pulse">Pulse</Checkbox>
        <Checkbox value="tone">Tone</Checkbox>
        <Checkbox value="noise">Noise</Checkbox>


      </CheckboxGroup>

      <CheckboxGroup
        isRequired
        isInvalid={invalidMaskingType}
        label="Select masking type"
        orientation="horizontal"
        value={selectedMaskingType}
        className="mt-4"
        onValueChange={(value) => {
          setInvalidMaskingType(value.length < 1);
          setSelectedMaskingType([...value.slice(-1)]);
        }}
      >
        <Checkbox value="time">Time</Checkbox>
        <Checkbox value="frequency">Frequency</Checkbox>


      </CheckboxGroup>
      </>
      ) : (
        <TestInterface maskerType={selectedMasker[0]} maskeeType={selectedMaskee[0]} maskingType={selectedMaskingType[0]}/>
      ))}
    </div>
  );
}
