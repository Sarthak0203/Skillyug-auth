#!/bin/bash

echo "🚀 Setting up Skillyug Authentication System..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

echo "📦 Installing dependencies..."
npm install

if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update the .env file with your Supabase credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 Supabase Setup Instructions:"
echo "1. Go to https://supabase.com and create a new project"
echo "2. Copy your project URL and anon key to the .env file"
echo "3. Run the SQL commands from README.md in your Supabase SQL editor"
echo "4. Configure authentication settings in Supabase dashboard"

echo ""
echo "🎉 Setup complete!"
echo "📖 Next steps:"
echo "   1. Update .env file with your Supabase credentials"
echo "   2. Set up Supabase database schema (see README.md)"
echo "   3. Run 'npm run dev' to start the development server"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo "📊 For architecture analysis, see AUTHENTICATION_ANALYSIS.md"
