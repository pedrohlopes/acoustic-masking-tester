import numpy as np


def butterworth_bandpass(lowcut, highcut, fs, order=4):
    
    """
    Calculate the coefficients for a 4th-order Butterworth bandpass filter.
    
    Parameters:
    - lowcut: Lower cutoff frequency (Hz)
    - highcut: Upper cutoff frequency (Hz)
    - fs: Sampling frequency (Hz)
    - order: Filter order (must be even)
    
    Returns:
    - b: Numerator coefficients
    - a: Denominator coefficients
    """
    # Pre-warp frequencies
    nyquist = 0.5 * fs
    low = np.tan(np.pi * lowcut / nyquist)
    high = np.tan(np.pi * highcut / nyquist)
    
    # Butterworth poles for analog prototype
    poles = []
    for k in range(1, order + 1):
        theta = (2 * k - 1) * np.pi / (2 * order)
        pole = -np.sin(theta) + 1j * np.cos(theta)
        poles.append(pole)
    
    # Map poles to bandpass
    bw = high - low
    center = np.sqrt(high * low)
    s_poles = [center * (p.imag * bw + p.real * 1j) for p in poles]
    
    # Bilinear transform
    z_poles = [(2 * fs + s) / (2 * fs - s) for s in s_poles]
    
    # Generate filter coefficients (using pole-zero representation)
    a = np.poly(z_poles).real
    b = np.poly([-1] * len(z_poles)).real
    return b, a

def apply_filter(signal, b, a):
    """
    Apply a digital filter using the difference equation.
    
    Parameters:
    - signal: Input signal
    - b: Numerator coefficients
    - a: Denominator coefficients
    
    Returns:
    - Filtered signal
    """
    y = np.zeros_like(signal)
    for n in range(len(signal)):
        y[n] = (b[0] * signal[n]
                + sum(b[i] * signal[n - i] for i in range(1, len(b)) if n - i >= 0)
                - sum(a[i] * y[n - i] for i in range(1, len(a)) if n - i >= 0)) / a[0]
    return y

if __name__ == "__main__":
    # Generate a test signal
    fs = 1000
    t = np.arange(0, 1, 1 / fs)
    x = np.sin(2 * np.pi * 5 * t) + np.sin(2 * np.pi * 250 * t)
    
    # Design a bandpass filter
    b, a = butterworth_bandpass(5, 50, fs)
        # Compare filter coefficients
    print("Custom filter coefficients:")
    print("b:", b)
    print("a:", a)
    # Apply the filter
    y = apply_filter(x, b, a)
    
    # Plot the results
    import matplotlib.pyplot as plt
    plt.plot(t, x, label="Original")
    plt.plot(t, y, label="Filtered")
    plt.legend()
    plt.show()
    
    # Compare to SciPy
    from scipy.signal import butter, lfilter
    b, a = butter(4, [5, 50], btype="bandpass", fs=fs)
    y = lfilter(b, a, x)
    plt.plot(t, x, label="Original")
    plt.plot(t, y, label="Filtered (SciPy)")
    plt.legend()
    plt.show()
    

    print("SciPy filter coefficients:")
    print("b:", b)
    print("a:", a)