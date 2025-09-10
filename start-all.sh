#!/bin/bash

# Exam Portal System - Start All Applications
echo "🚀 Starting Exam Portal System..."
echo ""

# Function to check if port is available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check required ports
echo "🔍 Checking required ports..."
check_port 5001 || echo "   Backend may already be running"
check_port 3000 || echo "   Student portal may already be running"  
check_port 3001 || echo "   Admin panel may already be running"
echo ""

# Start backend server
echo "🔧 Starting Backend Server (Port 5001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..
echo "   Backend PID: $BACKEND_PID"
sleep 3

# Start student portal
echo "🎓 Starting Student Exam Portal (Port 3000)..."
cd frontend  
npm start &
FRONTEND_PID=$!
cd ..
echo "   Student Portal PID: $FRONTEND_PID"
sleep 3

# Start admin panel
echo "🔐 Starting Admin Panel (Port 3001)..."
cd admin-panel
PORT=3001 npm start &
ADMIN_PID=$!
cd ..
echo "   Admin Panel PID: $ADMIN_PID"
sleep 3

echo ""
echo "✅ All applications started successfully!"
echo ""
echo "📋 Access URLs:"
echo "   🎓 Student Exam Portal: http://localhost:3000"
echo "   🔐 Admin Panel:         http://localhost:3001 (Password: admin123)"
echo "   🔧 Backend API:         http://localhost:5001"
echo ""
echo "🛑 To stop all applications, press Ctrl+C or run:"
echo "   kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID"
echo ""

# Keep script running
wait
