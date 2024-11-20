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

    return base_audio
    #return StreamingResponse(buffer, media_type="audio/wav")

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
    return base_audio
    #return StreamingResponse(buffer, media_type="audio/wav")

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

    return base_audio
    #return StreamingResponse(buffer, media_type="audio/wav")

def generate_experiment(
        sample_rate: int = 44100,
        masker_type: str = 'tone',
        masker_amplitude: float = 0.3,
        masker_duration: float = 0.1,
        masker_location: float = 0.5,
        masker_fade_duration: float = 0.01,
        masker_fade_type: str = 'exponential',
        maskee_type: str = 'tone',
        maskee_frequency: float = 440.0,
        maskee_amplitude: float = 0.3,
        maskee_duration: float = 0.1,
        maskee_location: float = 0.5,
        maskee_fade_duration: float = 0.01,
        masker_bandwidth: float = 155,
        maskee_fade_type: str = 'exponential',
        grid_type: str = 'frequency',
        grid_min: float = 100.0,
        grid_max: float = 10000.0,
        number_of_grid_points: int = 10
    ) -> np.ndarray:
    """
    Generates an experiment with a masker and a maskee, returning the maskee as a WAV file.

    Args:
        sample_rate (int, optional): The sample rate of the audio signal. Defaults to 44100.
        masker_type (str, optional): The type of masker. Defaults to 'tone'.
        masker_amplitude (float, optional): The amplitude of the masker. Defaults to 0.3.
        masker_duration (float, optional): The duration of the masker in seconds. Defaults to 0.1.
        masker_location (float, optional): The location of the masker within the audio signal in seconds. Defaults to 0.5.
        masker_fade_duration (float, optional): The duration of the fade-in and fade-out for the masker in seconds. Defaults to 0.01.
        masker_fade_type (str, optional): The type of fade for the masker. Defaults to 'exponential'.
        maskee_type (str, optional): The type of maskee. Defaults to 'tone'.
        maskee_frequency (float, optional): The frequency of the maskee in Hz. Defaults to 440.0.
        maskee_amplitude (float, optional): The amplitude of the maskee. Defaults to 0.3.
        maskee_duration (float, optional): The duration of the maskee in seconds. Defaults to 0.1.
        maskee_location (float, optional): The location of the maskee within the audio signal in seconds. Defaults to 0.5.
        maskee_fade_duration (float, optional): The duration of the fade-in and fade-out for the maskee in seconds. Defaults to 0.01.
        masker_bandwidth (float, optional): The bandwidth of the masker in Hz. Defaults to 155.
        maskee_fade_type (str, optional): The type of fade for the maskee. Defaults to 'exponential'.    
        grid_type (str, optional): The type of grid. Defaults to 'frequency'.
        grid_min (float, optional): The minimum frequency of the grid in Hz. Defaults to 100.0.
        grid_max (float, optional): The maximum frequency of the grid in Hz. Defaults to 10000.0.
        number_of_grid_points (int, optional): The number of grid points. Defaults to 10.

    Returns:
        np.ndarray: The maskee as a NumPy array.
    """
    assert masker_type in ['tone', 'noise'], "Masker type not supported"
    assert masker_fade_type in ['exponential', 'linear'], "Masker fade type not supported"
    assert maskee_type in ['tone', 'noise'], "Maskee type not supported"
    assert maskee_fade_type in ['exponential', 'linear'], "Maskee fade type not supported"
    assert grid_type in ['frequency', 'time'], "Grid type not supported"
    assert maskee_frequency >= grid_min and maskee_frequency <= grid_max, "Maskee frequency outside of grid range"

    if grid_type == 'frequency':
        frequency_grid = np.linspace(masker_bandwidth//2 + grid_min, grid_max - masker_bandwidth//2, number_of_grid_points)
    else:
        AssertionError("Grid type not supported. To do time grid)")

    if maskee_type == 'tone':
        maskee = generate_tone(
            sample_rate=sample_rate,
            total_duration=10 * maskee_duration,
            frequency=maskee_frequency,
            center_in_time=maskee_location,
            tone_duration=maskee_duration,
            fade_duration=maskee_fade_duration,
            amplitude=maskee_amplitude,
            fade_type=maskee_fade_type
        )
    elif maskee_type == 'noise':
        maskee = generate_noise(
            sample_rate=sample_rate,
            total_duration=10 * maskee_duration,
            noise_duration=maskee_duration,
            center_in_time=maskee_location,
            center_frequency=maskee_frequency,
            bandwidth=maskee_frequency,
            fade_duration=maskee_fade_duration,
            amplitude=maskee_amplitude,
            fade_type=maskee_fade_type
        )
    else:
        AssertionError("Maskee type not supported. To do pulse")

    masker_list = []

    for frequency in frequency_grid:
        if masker_type == 'tone':
            masker = generate_tone(
                sample_rate=sample_rate,
                total_duration=10 * masker_duration,
                frequency=frequency,
                center_in_time=masker_location,
                tone_duration=masker_duration,
                fade_duration=masker_fade_duration,
                amplitude=masker_amplitude,
                fade_type=masker_fade_type
            )
        elif masker_type == 'noise':
            masker = generate_noise(
                sample_rate=sample_rate,
                total_duration=10 * masker_duration,
                noise_duration=masker_duration,
                center_in_time=masker_location,
                center_frequency=frequency,
                bandwidth=masker_bandwidth,
                fade_duration=masker_fade_duration,
                amplitude=masker_amplitude,
                fade_type=masker_fade_type
            )
        else:
            AssertionError("Masker type not supported.")
        masker_list.append(masker)

    return maskee, masker_list

if __name__ == "__main__":
    #uvicorn.run(app, host="localhost", port=8000)
    maskee, masker_list = generate_experiment(
            sample_rate = 44100,
            masker_type = 'noise',
            masker_amplitude = 0.3,
            masker_duration = 0.1,
            masker_location = 0.5,
            masker_fade_duration = 0.01,
            masker_fade_type = 'exponential',
            maskee_type = 'tone',
            maskee_frequency = 1000.0,
            maskee_amplitude = 0.3,
            maskee_duration = 0.1,
            maskee_location = 0.5,
            maskee_fade_duration = 0.01,
            masker_bandwidth = 155,
            maskee_fade_type = 'exponential',
            grid_type = 'frequency',
            grid_min = 100.0,
            grid_max = 10000.0,
            number_of_grid_points = 10
        )
    
    # print(maskee, masker_list)
    # import matplotlib.pyplot as plt
    # import numpy as np
    # plt.plot(np.abs(np.fft.rfft(maskee)))
    # for masker in masker_list:
    #     plt.plot(np.abs(np.fft.rfft(masker)))
    # plt.show()
