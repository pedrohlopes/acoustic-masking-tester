"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";


import { useEffect } from "react";
import { Slider, Spinner } from "@nextui-org/react";
import { button as buttonStyles } from "@nextui-org/theme";
import { TestSettings } from "./settingsModal";

import { createClient } from "@libsql/client";


const client = createClient({
  url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || "",
  authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
});

client.execute("SELECT * FROM test_results").then((result) => {
  console.log(result);
} )

interface MaskingTestProps {
  maskerType: string;
  maskeeType: string;
  maskingType: string;
  minGain: number;
  advancedSettings: TestSettings;
  onTestEnd: (savedGains: number[]) => void;
}

const fetchTestData = async (url: string, maskerType: string,maskeeType: string, maskingType:string, advancedSettings:TestSettings) => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
        masker_type: maskerType,
        maskee_type: maskeeType,
        masking_type: maskingType,
        timepulse_amplitude: advancedSettings.maskerLevel,
        grid_size: advancedSettings.gridSize,
        grid_step: maskingType== 'time'? advancedSettings.timeStep: advancedSettings.frequencyStep,
        sample_rate: advancedSettings.sampleRate,
        total_duration: advancedSettings.totalDuration,
        time_location: advancedSettings.maskerLocation,
        masker_frequency: advancedSettings.maskerFrequency,
        pulse_duration: advancedSettings.pulseDuration,
        wideband_noise_type: advancedSettings.WBNoiseType,
        wideband_noise_duration: advancedSettings.WBNoiseDuration,
        noise_bandwidth: advancedSettings.noiseBW,
        tone_duration: advancedSettings.toneDuration,
        raise_duration: advancedSettings.raiseDuration,
        raise_type: advancedSettings.raiseType
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const jsonResponse = await response.json();
  const maskerAudioBase64 = jsonResponse['masker'];
  const maskeesAudioBase64 = jsonResponse['maskee_signals']; 
  const maskerAudio = new Audio("data:audio/wav;base64," + maskerAudioBase64);
  const maskeesAudio = maskeesAudioBase64.map(
    (audio: string) => new Audio("data:audio/wav;base64," + audio)
  );
  return { masker: maskerAudio, maskees: maskeesAudio, maskerAudioBase64: maskerAudioBase64, maskeesAudioBase64: maskeesAudioBase64 };
};

const fetchCombinedSignals = async (url: string, maskerAudioBase64: string, maskeeAudioBase64: string, gain: number=1.0) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      masker: maskerAudioBase64,
      maskee_signal: maskeeAudioBase64,
      gain: gain
    })
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const jsonResponse = await response.json();
  const combinedAudioBase64 = jsonResponse['combined_signal'];
  return combinedAudioBase64;
}






export const MaskingTest = ({ maskerType, maskeeType, maskingType, advancedSettings, minGain, onTestEnd }: MaskingTestProps) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [currentMaskee, setCurrentMaskee] = useState<any>(null);
  const [combinedAudio, setCombinedAudio] = useState<any>(null);
  const [currentMaskeeGain, setCurrentMaskeeGain] = useState<number>(0);
  const [displayMaskeeGain, setDisplayMaskeeGain] = useState<number>(-minGain);
  const [loadingCombinedAudio,setLoadingCombinedAudio] = useState<boolean>(true);
  const [savedGains, setSavedGains] = useState<number[]>([]);

  

  const handleContinuebutton = () => {
    console.log(currentStage, data.maskees.length)
    const newStage = currentStage + 1;
    setCurrentStage(newStage);
    let newSavedGains = [...savedGains, displayMaskeeGain];
    setSavedGains(newSavedGains);
    console.log(newSavedGains);
    setCurrentMaskeeGain(0);
    setDisplayMaskeeGain(-minGain);
    if (newStage >= data.maskees.length) {
      onTestEnd(newSavedGains);
      return;
    }
  
    
  }

  const handleUpdategain = async (value: number | number[]) => {
    let gain = 0
    if (Array.isArray(value)) {
      gain = value[0]
    } else {
      gain = value
    }
    setLoadingCombinedAudio(true);
    const combinedAudioBase64 = await fetchCombinedSignals('api/py/combine_signals', data.maskerAudioBase64, data.maskeesAudioBase64[currentStage], gain + minGain);
    const newCombinedAudio = new Audio("data:audio/wav;base64," + combinedAudioBase64);
    newCombinedAudio.play();
    setCombinedAudio(newCombinedAudio);
    setLoadingCombinedAudio(false);
  }

  const useFetchJson = (url: string) => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
      const fetchData = async () => {

          const jsonData = await fetchTestData(url,maskerType,maskeeType,maskingType, advancedSettings);
          const combinedAudioBase64 = await fetchCombinedSignals('api/py/combine_signals', jsonData.maskerAudioBase64, jsonData.maskeesAudioBase64[currentStage]);
          setLoadingCombinedAudio(false);
          setData(jsonData);
          const combinedAudio = new Audio("data:audio/wav;base64," + combinedAudioBase64);
          setCurrentMaskee(jsonData.maskees[currentStage]);
          setCombinedAudio(combinedAudio);

      };
  
      fetchData();
    }, [url]);
  
    return { data, error };
  };


  const { data, error } = useFetchJson("/api/py/gen_signals");
  
  return (
    <div className="mt-4">
      {data ? (
        <div>
          <p>Masker ({maskerType}):</p>
            {data.masker && (
              <>
                <audio controls src={data.masker.src} hidden></audio>
                <Button
                  onClick={() => {
                    data.masker.play();
                  }}
                >
                  Play Masker Only
                </Button>
              
              </>
            )}
          <p className="mt-4">Maskee ({maskeeType}):</p>
          {
            currentMaskee &&
            <div key={'audio_div'}>
              <audio controls src={currentMaskee.src} key={'audioMaskee'} hidden></audio>
            </div>
          }
          <div>
            <Button
              onClick={() => {
                if (currentMaskee) {
                  currentMaskee.play();
                }
              }}
            >
              Play Maskee Only
            </Button>
          </div>
          <p className="mt-4">Combined audio:</p>
          {
            loadingCombinedAudio? <Spinner/>:
            <div key={'audio_div_combined'}>
              <audio controls src={combinedAudio.src} key={'audioCombined'} hidden></audio>
            </div>
          }
          <div>
            <Button
              onClick={() => {
                if (combinedAudio) {
                  combinedAudio.play();
                }
              }}
            >
              Play Both
            </Button>
          </div>
          <p className="mt-4">Maskee gain: (adjust until barely hearable)</p>
            <Slider
              value={displayMaskeeGain}
              onChange={(value: number | number[]) => {
                if (Array.isArray(value)) {
                  setDisplayMaskeeGain(value[0]);
                  setCurrentMaskeeGain(minGain + value[0]);
                } else {
                  setDisplayMaskeeGain(value);
                  setCurrentMaskeeGain(minGain + value);

                }
              }}
              aria-label="Maskee gain"
              step={0.01} 
              maxValue={-minGain}
              onChangeEnd={handleUpdategain}
              minValue={0} 
            />
            <p className="text-default-500 font-medium text-small">Current gain: {displayMaskeeGain} dB SPL</p>

          </div>
      )
       : (
        <p>Loading...</p>
      )}
        <div className="mt-8">
        <Button
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          onClick={() => {
            handleContinuebutton();
          }}
        >
          Next maskee
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="m11 19l6-7l-6-7"/><path d="m7 19l6-7l-6-7"/></g></svg>
        </Button>
      </div>
      
    </div>
    
  );
};
