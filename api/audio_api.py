from fastapi import FastAPI
import numpy as np
import uvicorn
import io
import soundfile as sf
from scipy.signal import butter, lfilter
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import base64
import matplotlib.pyplot as plt
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
import matplotlib

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/api/py", response_class=HTMLResponse)
async def read_items():
    html_content = """
    <html>
        <head>
            <title>I'm alive!</title>
        </head>
        <body>
            <h1>Look ma! HTML!</h1>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)

def noise_psd(N, psd = lambda f: 1):
    X_white = np.fft.rfft(np.random.randn(N))
    S = psd(np.fft.rfftfreq(N))
    # Normalize S
    S = S / np.sqrt(np.mean(S**2))
    X_shaped = X_white * S
    return np.fft.irfft(X_shaped)

def PSDGenerator(f):
    return lambda N: noise_psd(N, f)

@PSDGenerator
def white_noise(f):
    return 1;

@PSDGenerator
def blue_noise(f):
    return np.sqrt(f);

@PSDGenerator
def violet_noise(f):
    return f;

@PSDGenerator
def brown_noise(f):
    return 1/np.where(f == 0, float('inf'), f)

@PSDGenerator
def pink_noise(f):
    return 1/np.where(f == 0, float('inf'), np.sqrt(f))

def generate_pulse(
        sample_rate: int = 44100,
        total_duration: float = 1.0, 
        timepulse_location: float = 0.5, 
        timepulse_duration: float = 0.005, 
        timepulse_amplitude: float = 0.3,
        raise_type: str = 'exponential'
        ) -> np.ndarray:
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

@app.post("/api/py/generate_calibration_signal", response_class=JSONResponse)
def generate_calibration_signal(configs:dict) -> dict:
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

@app.get("/api/py/get_tone")
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
    print('generate_tone', sample_rate, total_duration, frequency, center_in_time, tone_duration, fade_duration, amplitude, fade_type)
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
    
    
def generate_wideband_noise(
        sample_rate: int = 44100,
        total_duration: float = 1.0,
        wideband_noise_duration = 0.01,
        wideband_noise_center_in_time = 0.5,
        amplitude: float = 0.3,
        noise_type: str = 'white'
    ) -> StreamingResponse:
    base_audio = np.zeros(int(sample_rate * total_duration))
    noise_start = int(sample_rate * wideband_noise_center_in_time) - int(sample_rate * wideband_noise_duration / 2)
    noise_end = noise_start + int(sample_rate * wideband_noise_duration)
    if noise_type == 'white':
        noise = white_noise(noise_end - noise_start)
    elif noise_type == 'blue':
        noise = blue_noise(noise_end - noise_start)
    elif noise_type == 'violet':
        noise = violet_noise(noise_end - noise_start)
    elif noise_type == 'brown':
        noise = brown_noise(noise_end - noise_start)
    elif noise_type == 'pink':
        noise = pink_noise(noise_end - noise_start)
    
    noise = amplitude * noise / np.max(np.abs(noise))
    base_audio[noise_start:noise_start + len(noise)] = noise
    buffer = io.BytesIO()
    sf.write(buffer, base_audio, sample_rate, format='WAV')
    buffer.seek(0)
    return base_audio
    
    
        


def generate_narrowband_noise(
        sample_rate: int = 44100,
        total_duration: float = 1.0,
        center_frequency: float = 1000.0,
        center_in_time: float = 0.5,
        noise_duration: float = 0.1,
        bandwidth_percentage: float = 10.0,
        fade_duration: float = 0.01,
        amplitude: float = 0.3,
        fade_type: str = 'exponential'
    ) -> StreamingResponse:
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
    print(center_frequency, bandwidth_percentage)
    # Define bandpass filter range
    bandwidth = center_frequency * bandwidth_percentage / 100
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
    
@app.post("/api/py/gen_signals", response_class=JSONResponse)
def gen_signals(
    configs: dict
    ) -> dict:
    
    grid_size = configs.get('grid_size', 10)
    grid_step = configs.get('grid_step', 0.01)
    sample_rate = configs.get('sample_rate', 44100)
    total_duration = configs.get('total_duration', 1.0)
    time_location = configs.get('time_location', 0.5)
    pulse_duration = configs.get('pulse_duration', 0.005)
    tone_duration = configs.get('tone_duration', 0.8)
    amplitude = 10**(configs.get('masker_gain', -3)/20)
    masker_frequency = configs.get('masker_frequency', 1000.0)
    raise_type = configs.get('raise_type', 'exponential')
    masker_type = configs.get('masker_type', 'pulse')
    maskee_type = configs.get('maskee_type', 'pulse')
    masking_type = configs.get('masking_type', 'time')
    wideband_noise_type = configs.get('wideband_noise_type', 'white')
    wideband_noise_duration = configs.get('wideband_noise_duration', 0.01)
    noise_bandwidth = configs.get('noise_bandwidth', 10.0)
    raise_duration = configs.get('raise_duration', 0.01)
    
    if masker_type == 'pulse':
        masker = generate_pulse(sample_rate, total_duration, time_location, pulse_duration, amplitude, raise_type)
    elif masker_type == 'tone':
        masker = generate_tone(sample_rate, total_duration,masker_frequency, time_location, tone_duration,raise_duration, amplitude, raise_type)
    elif masker_type == 'narrowband-noise':
        masker = generate_narrowband_noise(sample_rate, total_duration,masker_frequency, time_location, tone_duration, noise_bandwidth,raise_duration, amplitude, raise_type)
    elif masker_type == 'wideband-noise':
        masker = generate_wideband_noise(sample_rate, total_duration, wideband_noise_duration, time_location, amplitude, wideband_noise_type)
    
    masker_file = io.BytesIO()
    sf.write(masker_file, masker, sample_rate, format='WAV')
    if masking_type == 'time':
        grid_locations = time_location + np.arange(-grid_size // 2, grid_size // 2) * grid_step
    elif masking_type == 'frequency':
        grid_locations = masker_frequency + np.arange(-grid_size // 2, grid_size // 2) * grid_step
    maskee_signals = []
    for loc in grid_locations:
        if maskee_type == 'pulse':
            maskee_signal = generate_pulse(sample_rate, total_duration, loc, pulse_duration, amplitude, raise_type)
        elif maskee_type == 'tone':
            maskee_signal = generate_tone(sample_rate, total_duration, loc,time_location, tone_duration, raise_duration, amplitude, raise_type)
        elif maskee_type == 'narrowband-noise':
            maskee_signal = generate_narrowband_noise(sample_rate, total_duration,loc, time_location, tone_duration, noise_bandwidth,raise_duration, amplitude, raise_type)
        
        maskee_file = io.BytesIO()
        sf.write(maskee_file, maskee_signal, sample_rate, format='WAV')
        maskee_signals.append(maskee_file)
    
    return JSONResponse(content=
    {
        "masker": base64.b64encode(masker_file.getvalue()).decode('utf-8'),
        "maskee_signals": [base64.b64encode(maskee.getvalue()).decode('utf-8') for maskee in maskee_signals]
    }
    )


    
@app.post("/api/py/combine_signals", response_class=JSONResponse)
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

@app.post("/api/py/plot_masking_curve", response_class=FileResponse)
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
    grid_type = data.get('grid_type', 'time')
    masker_info = data.get('masker_info', {})
    masker_placement = masker_info.get('placement', 0.5)
    grid_label = 'Time (s)' if grid_type == 'time' else 'Frequency (Hz)'
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
    plt.xlabel(grid_label)
    plt.ylabel('Gain (dB)')
    plt.title('Masking Curve')
    plt.grid(True)

    image_file = '/tmp/masking_curve.png'
    plt.savefig(image_file)
    plt.close()
    
    return FileResponse(image_file)


if __name__ == "__main__":
    uvicorn.run("audio_api:app", host="0.0.0.0", port=8000, reload=True)