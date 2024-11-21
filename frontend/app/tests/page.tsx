'use client';
import { subtitle, title } from "@/components/primitives";
import React from "react";
import {CheckboxGroup, Checkbox, Button} from "@nextui-org/react";
import {button as buttonStyles} from "@nextui-org/theme";
import {TestInterface} from "@/components/testInterface";

export default function TestsPage() {
  const [invalidMasker,setInvalidMasker] = React.useState(false);
  const [invalidMaskee,setInvalidMaskee] = React.useState(false);
  const [invalidMaskingType, setInvalidMaskingType] = React.useState(false);
  const [selectedMasker, setSelectedMasker] = React.useState(["pulse"]);
  const [selectedMaskee, setSelectedMaskee] = React.useState(["pulse"]);
  const [selectedMaskingType, setSelectedMaskingType] = React.useState(["time"]);
  const [stage,setStage] = React.useState(0);
  return (
    <div>
      <h1 className={title()}>Masking tests</h1>
      <p className="mt-2 mb-8">
        Setup the test by choosing the masker, maskee and masking type.
      </p>
      {(stage == 0   ? (<>
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
      <div className="mt-8">
        <Button
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          onClick={() => {
            setStage(stage + 1);
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
