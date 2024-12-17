"use client";

import { useState, useEffect } from "react";

interface MaskerInfo {
  placement: number;
  gain: number;
}

interface TestResultProps {
  selectedGains: number[];
  grid: number[];
  maskerInfo: MaskerInfo;
  minGain: number;
}




const fetchTestResultImage = async (url: string, gains: number[], grid: number[], maskerInfo: MaskerInfo, minGain: number) => {
  maskerInfo.gain = maskerInfo.gain - minGain
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      gains: gains,
      maskerInfo: maskerInfo,
      grid: grid
    })
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const blob = await response.blob();
  const imageUrl = URL.createObjectURL(blob);
  return imageUrl;
}







export const TestResults = ({ selectedGains, grid, maskerInfo, minGain }: TestResultProps) => {
  

  const [image, setImage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const fetchImage = async () => {
    try {
      const imageUrl = await fetchTestResultImage('http://localhost:8000/plot_masking_curve', selectedGains, grid, maskerInfo, minGain);
      setImage(imageUrl);
    } catch (error) {
      console.error("Failed to fetch image:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchImage();
  }, []);
  
  return (
    <div className="mt-4">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Resulting mask:</p>
          <img src={image} alt="Masking test results" />
        </div>
            
      )}
        
    </div>
    
  );
};
