from fastapi import FastAPI
import numpy as np
import uvicorn
import io
import soundfile as sf
from scipy.signal import butter, lfilter
from fastapi.responses import StreamingResponse
import base64
import matplotlib.pyplot as plt
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
import matplotlib

app = FastAPI()

def generate_pulse(
        sample_rate: int = 44100,
        total_duration: float = 1.0, 
        timepulse_location: float = 0.5, 
        timepulse_duration: float = 0.005, 
        timepulse_amplitude: float = 0.3,
        raise_type: str = 'exponential'
        ) -> np.ndarray:
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
    return base_audio

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
    
@app.post("/mock_gen_signals", response_class=JSONResponse)
def mock_gen_signals(
    configs: dict
    ) -> dict:
    
    grid_size = configs.get('grid_size', 10)
    grid_step = configs.get('grid_step', 0.01)
    sample_rate = configs.get('sample_rate', 44100)
    total_duration = configs.get('total_duration', 1.0)
    time_location = configs.get('time_location', 0.5)
    duration = configs.get('duration', 0.005)
    amplitude = 10**(configs.get('masker_gain', -3)/20)
    masker_frequency = configs.get('masker_frequency', 1000.0)
    raise_type = configs.get('raise_type', 'exponential')
    masker_type = configs.get('masker_type', 'pulse')
    maskee_type = configs.get('maskee_type', 'pulse')
    masking_type = configs.get('masking_type', 'time')
    
    if masker_type == 'pulse':
        masker = generate_pulse(sample_rate, total_duration, time_location, duration, amplitude, raise_type)
    elif masker_type == 'tone':
        masker = generate_tone(sample_rate, total_duration,masker_frequency, time_location, duration, amplitude, raise_type)
    elif masker_type == 'noise':
        masker = generate_noise(sample_rate, total_duration, time_location, duration, amplitude, raise_type)
        
    masker_file = io.BytesIO()
    sf.write(masker_file, masker, sample_rate, format='WAV')
    if masking_type == 'time':
        grid_locations = time_location + np.arange(-grid_size // 2, grid_size // 2) * grid_step
    elif masking_type == 'frequency':
        grid_locations = masker_frequency + np.arange(-grid_size // 2, grid_size // 2) * grid_step
    maskee_signals = []
    for loc in grid_locations:
        if maskee_type == 'pulse':
            maskee_signal = generate_pulse(sample_rate, total_duration, loc, duration, amplitude, raise_type)
        elif maskee_type == 'tone':
            maskee_signal = generate_tone(sample_rate, total_duration, loc,time_location, duration, amplitude, raise_type)
        maskee_file = io.BytesIO()
        sf.write(maskee_file, maskee_signal, sample_rate, format='WAV')
        maskee_signals.append(maskee_file)
    
    return JSONResponse(content=
    {
        "masker": base64.b64encode(masker_file.getvalue()).decode('utf-8'),
        "maskee_signals": [base64.b64encode(maskee.getvalue()).decode('utf-8') for maskee in maskee_signals]
    }
    )


    
@app.post("/combine_signals", response_class=JSONResponse)
def combine_signals(
    signals_data: dict,
    ) -> dict:
    masker = base64.b64decode(signals_data['masker'])
    masker = io.BytesIO(masker)
    masker, _ = sf.read(masker)
    maskee_signal = base64.b64decode(signals_data['maskee_signal'])
    maskee_signal = io.BytesIO(maskee_signal)
    maskee_signal, _ = sf.read(maskee_signal)
    gain_db = signals_data.get('gain', 0)
    gain_linear = 10 ** (gain_db / 20)  # Convert gain from dB to linear scale
    combined_signal = masker + gain_linear * maskee_signal
    combined_file = io.BytesIO()
    sf.write(combined_file, combined_signal, 44100, format='WAV')
    return JSONResponse(content=
        {
            "combined_signal": base64.b64encode(combined_file.getvalue()).decode('utf-8')
        }
    )
    
@app.post("/generate_masking_curve", response_class=JSONResponse)

@app.post("/plot_masking_curve", response_class=FileResponse)
def plot_masking_curve(data: dict) -> FileResponse:
    """
        Plots the masking curve and returns the image file.
        Args:
            data (dict): A dictionary containing the gain array and the grid array.
                gain (list): The gain values.
                grid (list): The grid values for the x-axis.
                maskerInfo (dict): A dictionary containing the masker information.
        Returns:
            FileResponse: A file response containing the plotted image of the masking curve.
    """
    maskee_gains = data.get('gains', [])
    grid = data.get('grid', [])
    masker_info = data.get('maskerInfo', {})
    masker_placement = masker_info.get('placement', 0.5)
    masker_gain = masker_info.get('gain', 60)
    print(len(maskee_gains), len(grid))
    if not maskee_gains or not grid or len(maskee_gains) != len(grid):
        print(data)
        return JSONResponse(content={"error": "Invalid data"}, status_code=400)
    print('plot_masking_curve', data)
    matplotlib.use('Agg')  # Use a non-interactive backend

    plt.figure()
    plt.plot(grid, maskee_gains, marker='o')
    plt.plot(grid, maskee_gains, linestyle='-', color='b', label='Maskees')
    plt.vlines(masker_placement, min(maskee_gains), masker_gain, colors='r', linestyles='dashed', label='Masker')
    plt.plot(masker_placement, masker_gain, marker='o', color='r')
    plt.legend()
    plt.xlabel('Grid')
    plt.ylabel('Gain (dB)')
    plt.title('Masking Curve')
    plt.grid(True)

    image_file = '/tmp/masking_curve.png'
    plt.savefig(image_file)
    plt.close()
    
    return FileResponse(image_file)

@app.post("/generate_calibration_signal", response_class=JSONResponse)
def generate_calibration_signal(configs:dict) -> dict:
    """
        Generates a calibration signal and returns it as a WAV file.
        Args:
            configs (dict): A dictionary containing the configuration parameters for the calibration signal.
                volume (float, optional): The volume of the calibration signal in dB. Defaults to 0.
                sample_rate (int, optional): The sample rate of the calibration signal. Defaults to 44100.
                total_duration (float, optional): The total duration of the calibration signal in seconds. Defaults to 1.0.
        Returns:
            JSONResponse: A JSON response containing the generated WAV audio file with the calibration signal.
    """
    gain = configs.get('volume', 0)
    sample_rate = configs.get('sample_rate', 44100)
    total_duration = configs.get('total_duration', 1.0)
    t = np.linspace(0, total_duration, int(sample_rate * total_duration), endpoint=False)
    frequency = 2000  # 2 kHz
    amplitude = 10 ** (gain / 20)  # Convert gain from dB to linear scale
    calibration_signal = amplitude * np.sin(2 * np.pi * frequency * t)
    signal_file = io.BytesIO()
    sf.write(signal_file, calibration_signal, sample_rate, format='WAV', subtype='PCM_16')
    
    return JSONResponse(content=
        {
            "calibration_signal": base64.b64encode(signal_file.getvalue()).decode('utf-8')
        }
    )