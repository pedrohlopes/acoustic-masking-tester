from fastapi import FastAPI
import numpy as np
import uvicorn
import io
import soundfile as sf
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.get("/get_pulse")
def generate_pulse(
        sample_rate: int = 44100,
        total_duration: float = 1.0, 
        timepulse_location: float = 0.5, 
        timepulse_duration: float = 0.005, 
        timepulse_amplitude: float = 0.3,
        raise_type: str = 'exponential'
        ) -> StreamingResponse:
    """
        Generates an audio signal with a pulse and returns it as a WAV file.

        Args:
            sample_rate (int, optional): The sample rate of the audio signal. Defaults to 44100.
            total_duration (float, optional): The total duration of the audio signal in seconds. Defaults to 1.0.
            timepulse_location (float, optional): The location of the time pulse within the audio signal in seconds. Defaults to 0.5.
            timepulse_duration (float, optional): The duration of the time pulse in seconds. Defaults to 0.005.
            timepulse_amplitude (float, optional): The amplitude of the time pulse. Defaults to 0.3.
            raise_type (str, optional): The type of rise for the time pulse. Defaults to 'exponential'.

        Returns:
            StreamingResponse: A streaming response containing the generated WAV audio file with the generated pulse.
    """
    base_audio = np.zeros(int(sample_rate * total_duration))
    time_pulse_start = int(sample_rate * timepulse_location) - int(sample_rate * timepulse_duration / 2)
    time_pulse_end = int(sample_rate * timepulse_location) + int(sample_rate * timepulse_duration / 2) - 1 # symmetry, might be bad... TODO: refactor
    time_pulse = np.linspace(0, 1, int(sample_rate * timepulse_duration / 2))
    if raise_type == 'exponential':
        time_pulse = np.exp(np.linspace(0, 1, int(sample_rate * timepulse_duration / 2))) - 1
        time_pulse = time_pulse / np.max(time_pulse)
    time_pulse = np.concatenate((time_pulse, time_pulse[1:][::-1]))
    time_pulse = timepulse_amplitude * time_pulse
    base_audio[time_pulse_start:time_pulse_end] = time_pulse
    buffer = io.BytesIO()
    sf.write(buffer, base_audio, sample_rate, format='WAV')
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="audio/wav")

@app.get("/get_tone")
def generate_tone(
        sample_rate: int = 44100,
        total_duration: float = 1.0,
        frequency: float = 440.0,
        center_in_time: float = 0.5,
        tone_duration: float = 0.1,
        fade_duration: float = 0.01,
        amplitude: float = 0.3,
        fade_type: str = 'exponential'
    ) -> StreamingResponse:
    """
        Generates an audio signal with a tone and returns it as a WAV file.

        Args:
            sample_rate (int, optional): The sample rate of the audio signal. Defaults to 44100.
            total_duration (float, optional): The total duration of the audio signal in seconds. Defaults to 1.0.
            frequency (float, optional): The frequency of the tone in Hz. Defaults to 440.0.
            center_in_time (float, optional): The location of the tone within the audio signal in seconds. Defaults to 0.5.
            tone_duration (float, optional): The duration of the tone in seconds. Defaults to 0.005.
            fade_duration (float, optional): The duration of the fade in and fade out in seconds. Defaults to 0.001.
            amplitude (float, optional): The amplitude of the tone. Defaults to 0.3.
            fade_type (str, optional): The type of fade for the tone. Defaults to 'exponential'.

        Returns:
            StreamingResponse: A streaming response containing the generated WAV audio file with the generated tone.
    """
    base_audio = np.zeros(int(sample_rate * total_duration))
    tone_start = int(sample_rate * center_in_time) - int(sample_rate * tone_duration / 2)
    tone_end = int(sample_rate * center_in_time) + int(sample_rate * tone_duration / 2)
    tone = np.linspace(0, 2 * np.pi * frequency * tone_duration, int(sample_rate * tone_duration))
    tone = amplitude * np.sin(tone)
    fade = np.linspace(0, 1, int(sample_rate * fade_duration))
    if fade_type == 'exponential':
        fade = np.exp(np.linspace(0, 1, int(sample_rate * fade_duration))) - 1
        fade = fade / np.max(fade)
    fade_in = fade
    fade_out = fade[::-1]
    tone[:len(fade_in)] = tone[:len(fade_in)] * fade_in
    tone[-len(fade_out):] = tone[-len(fade_out):] * fade_out
    base_audio[tone_start:tone_end] = tone
    buffer = io.BytesIO()
    sf.write(buffer, base_audio, sample_rate, format='WAV')
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="audio/wav")




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)