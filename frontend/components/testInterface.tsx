"use client";

import { useState } from "react";
import { Button } from "@nextui-org/button";

interface TestInterfaceProps {
  maskerType: string;
  maskeeType: string;
  maskingType: string;
}
import { useEffect } from "react";
import { Slider, Spinner } from "@nextui-org/react";
import { button as buttonStyles } from "@nextui-org/theme";


const fetchTestData = async (url: string) => {
  const response = await fetch(url);
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

const fetchCombinedSignals = async (url: string, maskerAudioBase64: string, maskeeAudioBase64: string, volume: number=1.0) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      masker: maskerAudioBase64,
      maskee_signal: maskeeAudioBase64,
      volume: volume
    })
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const jsonResponse = await response.json();
  const combinedAudioBase64 = jsonResponse['combined_signal'];
  return combinedAudioBase64;
}






export const TestInterface = ({ maskerType, maskeeType, maskingType }: TestInterfaceProps) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [currentMaskee, setCurrentMaskee] = useState<any>(null);
  const [combinedAudio, setCombinedAudio] = useState<any>(null);
  const [currentMaskeeVolume, setCurrentMaskeeVolume] = useState<number>(1.0);
  const [currentWavHeader, setCurrentWavHeader] = useState<string>("");
  const [loadingCombinedAudio,setLoadingCombinedAudio] = useState<boolean>(true);
  const [savedVolumes, setSavedVolumes] = useState<number[]>([]);

  const handleContinuebutton = () => {
    if (currentStage - 1 === data.maskees.length) {
      return;
    }
    setCurrentStage(currentStage + 1);
    console.log(currentMaskeeVolume)
    let newSavedVolumes = [...savedVolumes, currentMaskeeVolume];
    setSavedVolumes(newSavedVolumes);
    console.log(savedVolumes)
    setCurrentMaskeeVolume(1.0);
    
  }

  const handleUpdateVolume = async (value: number | number[]) => {
    let volume = 0
    if (Array.isArray(value)) {
      volume = value[0]
    } else {
      volume = value
    }
    setCurrentMaskeeVolume(volume);
    setLoadingCombinedAudio(true);
    const combinedAudioBase64 = await fetchCombinedSignals('http://localhost:8000/combine_signals', data.maskerAudioBase64, data.maskeesAudioBase64[currentStage], volume);
    const combinedAudio = new Audio("data:audio/wav;base64," + combinedAudioBase64);
    setCombinedAudio(combinedAudio);
    setLoadingCombinedAudio(false);
  }

  const useFetchJson = (url: string) => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
      const fetchData = async () => {

          const jsonData = await fetchTestData(url);
          const combinedAudioBase64 = await fetchCombinedSignals('http://localhost:8000/combine_signals', jsonData.maskerAudioBase64, jsonData.maskeesAudioBase64[currentStage]);
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


  const { data, error } = useFetchJson("http://localhost:8000/mock_gen_signals");
  
  return (
    <div>
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
          <p className="mt-4">Maskee volume: (set to first inaudible volume)</p>
            <Slider
              value={currentMaskeeVolume}
              onChange={(value: number | number[]) => {
                if (Array.isArray(value)) {
                  setCurrentMaskeeVolume(value[0]);
                } else {
                  setCurrentMaskeeVolume(value);
                }
              }}
              aria-label="Maskee volume"
              step={0.01} 
              maxValue={1}
              onChangeEnd={handleUpdateVolume}
              minValue={0} 
            />
            <p className="text-default-500 font-medium text-small">Current volume: {currentMaskeeVolume}</p>

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
