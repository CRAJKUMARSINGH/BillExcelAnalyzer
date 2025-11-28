#!/bin/bash
# ════════════════════════════════════════════════════════════════
# BILLGENERATOR - Quick Local Run Script
# macOS/Linux Shell Script for Easy Development Startup
# ════════════════════════════════════════════════════════════════

clear
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🚀 BILLGENERATOR - Local Development Server"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js detected:"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ ERROR: npm is not installed"
    echo ""
    exit 1
fi

echo "✅ npm detected:"
npm --version
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Start the development server
echo "════════════════════════════════════════════════════════════════"
echo "🎯 Starting BillGenerator Development Server..."
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📝 The application will be available at: http://localhost:5000"
echo ""
echo "Press CTRL+C to stop the server"
echo ""

npm run dev:client

# If the server crashes or exits
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Server encountered an error"
    echo ""
fi

exit 0
