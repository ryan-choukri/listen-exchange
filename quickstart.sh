#!/bin/bash
# ListenExchange - Quick Start Guide

echo "🎵 ListenExchange MVP - Quick Start"
echo "===================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🚀 Start Development Server:"
echo "   npm run dev"
echo "   → Open http://localhost:3001"
echo ""
echo "🏗️  Build for Production:"
echo "   npm run build"
echo ""
echo "📚 Documentation:"
echo "   - README.md             - Project overview"
echo "   - GUIDE_DEV.md          - Developer guide"
echo "   - EXAMPLES.md           - Code examples"
echo "   - ARCHITECTURE.md       - Design decisions"
echo ""
echo "📋 Pages to Visit:"
echo "   - http://localhost:3001/           (Landing)"
echo "   - http://localhost:3001/discover   (Listening)"
echo "   - http://localhost:3001/submit     (Submit Track)"
echo ""
echo "🧪 Testing the App:"
echo "   1. Go to /discover"
echo "   2. Wait 60 seconds (see timer)"
echo "   3. Type feedback (min 120 chars)"
echo "   4. Click 'Submit Feedback'"
echo "   5. See +1 credit earned ✨"
echo ""
echo "Happy coding! 🎵"
