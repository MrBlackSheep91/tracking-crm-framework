#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the build process
echo "Building TypeScript code..."
npm run build
echo "Build complete."

# Execute the main command (npm run dev)
# The 'exec' command replaces the shell with the new process,
# ensuring that signals are handled correctly by nodemon.
echo "Starting development server..."
exec "$@"
