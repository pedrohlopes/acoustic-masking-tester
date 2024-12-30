export const fixedMaskingConfigs = {
    "initialCalibrationVolume": -80,
    "maskingTypes": {
        "time": {
        "pulseMaskedByPulse": {
            "title": "Pulse masked by pulse",
            "masker": "pulse",
            "maskee": "pulse"
        },
        "pulseMaskedByNoise": {
            "title": "Pulse masked by wideband noise",
            "masker": "pulse",
            "maskee": "wideband-noise"
        },
        },
        "frequency": {
        "toneMaskedByTone": {
            "title": "Tone masked by tone",
            "masker": "tone",
            "maskee": "tone"
        },
        "toneMaskedByNoise": {
            "title": "Tone masked by narrowband noise",
            "masker": "tone",
            "maskee": "narrowband-noise"
        },
        "noiseMaskedByNoise":{
            "title": "Narrowband noise masked by narrowband noise",
            "masker": "narrowband-noise",
            "maskee": "narrowband-noise"
        }
        }
    }
  }