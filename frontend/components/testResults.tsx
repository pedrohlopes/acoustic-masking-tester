"use client";

import { useState, useEffect } from "react";

interface TestResultProps {
  selectedGains: number[];
  grid: number[];
}


const fetchTestResultImage = async (url: string, gains: number[], grid: number[]) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      gains: gains,
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







export const TestResults = ({ selectedGains, grid }: TestResultProps) => {
  

  const [image, setImage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const imageUrl = await fetchTestResultImage('http://localhost:8000/plot_masking_curve', selectedGains, grid);
        setImage(imageUrl);
      } catch (error) {
        console.error("Failed to fetch image:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [selectedGains, grid]);
  
  return (
    <div className="mt-4">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Resulting mask:</p>
          <img src={image} alt="Masking test result" />
        </div>
            
      )}
        
    </div>
    
  );
};