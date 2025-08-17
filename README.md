# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Skillyug Authentication System

A production-ready authentication system built with React, TypeScript, Tailwind CSS, and Supabase. Designed to scale to 40,000-50,000 users with comprehensive security features.

## 🚀 Features

### Authentication
- ✅ User registration with email verification
- ✅ Secure login with form validation
- ✅ Password strength indicators
- ✅ Forgot password functionality
- ✅ Email verification flow
- ✅ Session management with JWT tokens
- ✅ Role-based access control (Student, Instructor, Admin)
- ✅ Remember me functionality
- ✅ Automatic session refresh

### Security
- ✅ Password strength validation (uppercase, lowercase, numbers, special characters)
- ✅ Email format validation
- ✅ XSS protection
- ✅ CSRF protection via Supabase
- ✅ Row Level Security (RLS) policies
- ✅ Rate limiting on authentication endpoints
- ✅ Secure password hashing (bcrypt via Supabase)

### User Experience
- ✅ Real-time form validation
- ✅ Password visibility toggle
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Responsive design (mobile-first)
- ✅ Accessibility support
- ✅ Professional UI with glass morphism effects

### Technical Features
- ✅ TypeScript for type safety
- ✅ React Hook Form for efficient form handling
- ✅ Zod for schema validation
- ✅ Tailwind CSS for styling
- ✅ Lucide React for icons
- ✅ React Hot Toast for notifications

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Custom components with Lucide icons
- **Build Tool**: Vite
- **Deployment**: Ready for Vercel, Netlify, or any static host

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillyug-auth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Create the following table in your Supabase database:
   
   ```sql
   -- User profiles table
   create table user_profiles (
     id uuid references auth.users on delete cascade,
     email text unique not null,
     full_name text not null,
     user_type text check (user_type in ('student', 'instructor', 'admin')),
     avatar_url text,
     created_at timestamp with time zone default timezone('utc'::text, now()),
     updated_at timestamp with time zone default timezone('utc'::text, now()),
     email_verified boolean default false,
     last_sign_in_at timestamp with time zone,
     
     primary key (id)
   );
   
   -- Enable Row Level Security
   alter table user_profiles enable row level security;
   
   -- Create security policies
   create policy "Users can view own profile" 
     on user_profiles for select 
     using (auth.uid() = id);
   
   create policy "Users can update own profile" 
     on user_profiles for update 
     using (auth.uid() = id);
   
   create policy "Users can insert own profile" 
     on user_profiles for insert 
     with check (auth.uid() = id);
   
   -- Create indexes for performance
   create index idx_user_profiles_email on user_profiles(email);
   create index idx_user_profiles_user_type on user_profiles(user_type);
   ```

5. **Configure Supabase Authentication**
   
   In your Supabase dashboard:
   - Go to Authentication → Settings
   - Enable email confirmations
   - Set up email templates (optional)
   - Configure redirect URLs

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔐 Authentication Flow

### 1. User Registration
- User fills registration form → Form validation (Zod schema) → Check if email exists → Create user in Supabase Auth → Send verification email → Create user profile in database → Redirect to login with success message

### 2. Email Verification
- User clicks email verification link → Supabase confirms email → Update email_verified status → Redirect to dashboard

### 3. User Login
- User submits login credentials → Form validation → Authenticate with Supabase → Update last_sign_in_at → Set session token → Redirect to dashboard

### 4. Password Reset
- User requests password reset → Send reset email via Supabase → User clicks reset link → Update password → Automatic sign-in

## 📚 For detailed documentation, see [AUTHENTICATION_ANALYSIS.md](./AUTHENTICATION_ANALYSIS.md)

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Add your Supabase credentials to .env
npm run dev
```

Visit `http://localhost:5173` and start building!

## 📄 License

MIT License - see LICENSE file for details.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```
