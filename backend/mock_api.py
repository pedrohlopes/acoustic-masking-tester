from locale import normalize
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import uvicorn
import io
import soundfile as sf
from fastapi.responses import StreamingResponse
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



@app.get("/mock_gen_signals", response_class=JSONResponse)
def mock_gen_signals(
    grid_size: int = 10,
    grid_step: float = 0.001,
    sample_rate: int = 44100,
    total_duration: float = 1.0,
    timepulse_location: float = 0.5,
    timepulse_duration: float = 0.005,
    timepulse_amplitude: float = 0.8,
    raise_type: str = 'exponential'
    ) -> dict:
    masker = generate_pulse(sample_rate, total_duration, timepulse_location, timepulse_duration, timepulse_amplitude, raise_type)
    masker_file = io.BytesIO()
    sf.write(masker_file, masker, sample_rate, format='WAV')
    grid_locations = timepulse_location + np.arange(-grid_size // 2, grid_size // 2) * grid_step
    maskee_signals = []
    for loc in grid_locations:
        maskee_signal = generate_pulse(sample_rate, total_duration, loc, timepulse_duration, timepulse_amplitude, raise_type)
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
    gain = data.get('gains', [])
    grid = data.get('grid', [])
    masker_info = data.get('maskerInfo', {})
    masker_placement = masker_info.get('placement', 0)
    masker_gain = masker_info.get('gain', 0)
    
    if not gain or not grid or len(gain) != len(grid):
        print(data)
        return JSONResponse(content={"error": "Invalid data"}, status_code=400)
    
    matplotlib.use('Agg')  # Use a non-interactive backend

    plt.figure()
    plt.plot(grid, gain, marker='o')
    plt.plot(grid, gain, linestyle='-', color='b')
    plt.vlines(masker_placement, min(gain), masker_gain, colors='r', linestyles='dashed', label='Masker')
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
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)