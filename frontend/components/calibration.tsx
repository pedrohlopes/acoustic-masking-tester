"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";

import { useEffect } from "react";
import { Slider, Spinner } from "@nextui-org/react";
import { title, subtitle } from "@/components/primitives";
import { button as buttonStyles } from "@nextui-org/theme";
import { fixedMaskingConfigs } from "@/config/masking";



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


export const CalibrationStage = ({ onCalibrated }: { onCalibrated: (gain:number) => void }) => {
  const [volume, setVolume] = useState(fixedMaskingConfigs['initialCalibrationVolume']);
  const [calibrating, setCalibrating] = useState(false);
  const [toneAudioBase64, setToneAudioBase64] = useState("");
  const [toneAudio, setToneAudio] = useState<any>(null);
  const url = "http://localhost:8000/generate_calibration_signal";

  useEffect(() => {
    fetchCalibrationTone(url, volume).then((tone) => {
      setToneAudioBase64(tone);
      const audio = new Audio("data:audio/wav;base64," + tone);
      setToneAudio(audio);
      });
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        {(calibrating ? 
          (
            <div className="flex flex-col gap-3 w-full items-center justify-center"> 
            <p> Adjust the slider until the tone is barely hearable (move to hear the tone)</p>
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
            label="Gain (dB)"
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
      </section>
  );
};
