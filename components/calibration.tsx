"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";

import { useEffect } from "react";
import { Slider, Spinner } from "@nextui-org/react";
import { title, subtitle } from "@/components/primitives";
import { button as buttonStyles } from "@nextui-org/theme";
import { fixedMaskingConfigs } from "@/config/masking";
import { SettingsModal, TestSettings, defaultTestSettings } from "./settingsModal";

interface CalibrationStageProps {
  onCalibrated: (gain: number) => void;
  testSettings: TestSettings;
  setTestSettings: (settings: TestSettings) => void;
}


const fetchCalibrationTone = async (url: string, volume: number) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      volume: volume
    })
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const jsonResponse = await response.json();
  const toneAudioBase64 = jsonResponse['calibration_signal'];

  return toneAudioBase64;
}


export const CalibrationStage = ({onCalibrated, testSettings, setTestSettings}: CalibrationStageProps) => {
  const [volume, setVolume] = useState(fixedMaskingConfigs['initialCalibrationVolume']);
  const [calibrating, setCalibrating] = useState(false);
  const [toneAudioBase64, setToneAudioBase64] = useState("");
  const [toneAudio, setToneAudio] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const url = "/api/py/generate_calibration_signal";

  useEffect(() => {
    fetchCalibrationTone(url, volume).then((tone) => {
      setToneAudioBase64(tone);
      const audio = new Audio("data:audio/wav;base64," + tone);
      setToneAudio(audio);
      });
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <p className="text-center">Before we start, we need to calibrate your audio settings. <br></br>
      You will hear a tone and select the bottom loudness hearable limit with a slider. <br></br>
      Please make sure your OS upper volume limit is somewhere reasonably loud, as this will affect the dinamic range we can work with.<br></br>
      
      </p>
      {!calibrating ? <p className="text-center mt-[-1rem]">Oh, and if you need to change any specific settings, this is the time to do it! you can do so by clicking the button on the bottom right.</p>: null}
        {(calibrating ? 
          (
            <div className="flex flex-col gap-3 w-full items-center justify-center"> 
            <p> Adjust the slider until the tone is barely hearable <br></br>(move to hear the tone)</p>
          <Slider
            value={volume}
            onChange={(value) => {
              if (typeof value === 'number') {
                setVolume(value);
              }
            }}
            onChangeEnd={() => {fetchCalibrationTone(url,volume).then((tone) => {
              setToneAudioBase64(tone);
              const audio = new Audio("data:audio/wav;base64," + tone);
              audio.play(); 
              setToneAudio(audio);
              })
            }}
            minValue={-80}
            maxValue={0}
            showTooltip
            label="Gain (dB) from max. wav amplitude"
            aria-label="Desired Gain"
            
            step={1}
            className="w-full"></Slider>
            <Button className={buttonStyles({color: "primary"})} onClick={() => {
              onCalibrated(volume);
              setCalibrating(false);
            }}>
              All done!
            </Button>
            </div>

          )
            

        : (
        <Button
          className={buttonStyles( {color: "primary"})}
          onClick={() => {
            setCalibrating(true);
          }}
        >
          Calibrate
        </Button>
        ))}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
        {!calibrating && <Button
          className={buttonStyles({
            color: "secondary",
            radius: "full",
            variant: "shadow",
          })}
          onClick={() => {
            // Handle settings button click
            setModalOpen(true);
          }}
        >
          Test Settings
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.09.09a2 2 0 1 1-2.83 2.83l-.09-.09a1.65 1.65 0 0 0-1.82-.33a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.13a1.65 1.65 0 0 0-1-1.51a1.65 1.65 0 0 0-1.82.33l-.09.09a2 2 0 1 1-2.83-2.83l.09-.09a1.65 1.65 0 0 0 .33-1.82a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.13a1.65 1.65 0 0 0 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.09-.09a2 2 0 1 1 2.83-2.83l.09.09a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.13a1.65 1.65 0 0 0 1 1.51a1.65 1.65 0 0 0 1.82-.33l.09-.09a2 2 0 1 1 2.83 2.83l-.09.09a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.13a1.65 1.65 0 0 0-1.51 1z"/></g></svg>
        </Button>}
        <SettingsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} testSettings={testSettings} setTestSettings={(settings) => {setTestSettings(settings)}}/>
      </div>
      </section>
  );
};
