#!/bin/bash

# Function to cleanup processes
cleanup() {
    echo "Stopping services..."
    # Kill the frontend process and its children
    if [ -n "$frontend_pid" ]; then
        pkill -P $frontend_pid
        kill $frontend_pid
    fi
    # Kill the backend process and its children
    if [ -n "$backend_pid" ]; then
        pkill -P $backend_pid
        kill $backend_pid
    fi
    exit 0
}

# Set up trap to catch SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Start frontend
cd frontend
npm run dev &
frontend_pid=$!
cd ..

# Start backend
cd backend
eval "$(conda shell.bash hook)"
conda activate masking-tests
python audio_api.py &
backend_pid=$!
cd ..

echo "Services started:"
echo "Frontend PID: $frontend_pid"
echo "Backend PID: $backend_pid"

# Wait for both processes
wait $frontend_pid $backend_pid
