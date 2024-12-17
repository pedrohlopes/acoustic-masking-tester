#!/bin/bash
set -e

#!/bin/bash
set -e

# Print messages in color
green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    red "Error: conda is not installed!"
    exit 1
fi

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    red "Error: requirements.txt not found!"
    exit 1
fi

# Create conda environment
green "Creating conda environment 'masking-tests'..."
if conda env remove -n masking-tests &> /dev/null; then
    green "Removed existing environment"
fi

if conda create -n masking-tests python=3.10 -y; then
    green "Conda environment created successfully!"
else
    red "Error: Failed to create conda environment"
    exit 1
fi

# Activate environment and install requirements
green "Installing Python dependencies..."
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate masking-tests

if pip install -r requirements.txt; then
    green "Python dependencies installed successfully!"
else
    red "Error: Failed to install Python dependencies"
    exit 1
fi

conda deactivate

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    red "Error: frontend directory not found!"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    red "Error: npm is not installed!"
    exit 1
fi

# Navigate to frontend directory and install dependencies
cd frontend
green "Installing frontend dependencies..."
if npm install; then
    green "Frontend dependencies installed successfully!"
else
    red "Error: Failed to install frontend dependencies"
    exit 1
fi
