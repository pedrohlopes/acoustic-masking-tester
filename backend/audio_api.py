from fastapi import FastAPI
import numpy as np
import uvicorn
import io
import soundfile as sf
from fastapi.responses import StreamingResponse
from scipy.signal import butter, lfilter

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

@app.get("/get_noise")
def generate_noise(
        sample_rate: int = 44100,
        total_duration: float = 1.0,
        noise_duration: float = 0.1,
        center_in_time: float = 0.5,
        center_frequency: float = 1000.0,
        bandwidth: float = 200.0,
        fade_duration: float = 0.01,
        amplitude: float = 0.3,
        fade_type: str = 'exponential'
    ) -> StreamingResponse:
    """
    Generates band-passed Gaussian noise centered at a specific time with fade-in and fade-out, returning it as a WAV file.

    Args:
        sample_rate (int, optional): The sample rate of the audio signal. Defaults to 44100.
        total_duration (float, optional): The total duration of the audio signal in seconds. Defaults to 1.0.
        noise_duration (float, optional): The duration of the noise in seconds. Defaults to 0.1.
        center_in_time (float, optional): The location of the noise within the audio signal in seconds. Defaults to 0.5.
        center_frequency (float, optional): The center frequency of the bandpass filter in Hz. Defaults to 1000.0.
        bandwidth (float, optional): The bandwidth of the bandpass filter in Hz. Defaults to 200.0.
        fade_duration (float, optional): The duration of the fade-in and fade-out in seconds. Defaults to 0.01.
        amplitude (float, optional): The amplitude of the noise. Defaults to 0.3.
        fade_type (str, optional): The type of fade for the noise. Defaults to 'exponential'.

    Returns:
        StreamingResponse: A streaming response containing the generated WAV audio file with band-passed Gaussian noise.
    """
    def bandpass_filter(data, lowcut, highcut, fs, order=4):
        nyquist = 0.5 * fs
        low = lowcut / nyquist
        high = highcut / nyquist
        b, a = butter(order, [low, high], btype='band')
        return lfilter(b, a, data)

    # Prepare the base audio signal
    base_audio = np.zeros(int(sample_rate * total_duration))

    # Calculate noise start and end indices
    noise_start = int(sample_rate * center_in_time) - int(sample_rate * noise_duration / 2)
    noise_end = noise_start + int(sample_rate * noise_duration)

    # Generate Gaussian white noise
    noise = np.random.normal(0, 1, noise_end - noise_start)

    # Define bandpass filter range
    lowcut = center_frequency - bandwidth / 2
    highcut = center_frequency + bandwidth / 2

    # Apply bandpass filter
    filtered_noise = bandpass_filter(noise, lowcut, highcut, sample_rate)

    # Scale the noise to the desired amplitude
    filtered_noise = amplitude * filtered_noise / np.max(np.abs(filtered_noise))

    # Create fade-in and fade-out envelopes
    fade_samples = int(sample_rate * fade_duration)
    fade = np.linspace(0, 1, fade_samples)
    if fade_type == 'exponential':
        fade = np.exp(np.linspace(0, 1, fade_samples)) - 1
        fade = fade / np.max(fade)

    fade_in = fade
    fade_out = fade[::-1]

    # Apply fades
    filtered_noise[:fade_samples] *= fade_in
    filtered_noise[-fade_samples:] *= fade_out

    # Insert noise into the base audio
    base_audio[noise_start:noise_end] = filtered_noise

    # Write to buffer as WAV
    buffer = io.BytesIO()
    sf.write(buffer, base_audio, sample_rate, format='WAV')
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="audio/wav")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)