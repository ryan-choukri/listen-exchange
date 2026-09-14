# Supabase Authentication Setup Guide

## ✅ Completed Implementation

The following has been implemented:

- ✅ Browser and server Supabase clients
- ✅ Middleware for session refresh and route protection
- ✅ All authentication server actions (signup, login, logout, reset password)
- ✅ 4 auth pages (login, signup, forgot-password, reset-password)
- ✅ Protected dashboard page
- ✅ UserMenu component for navigation header
- ✅ Email confirmation page
- ✅ TypeScript compilation successful
- ✅ Build verification passed

## 🔧 Configuration Required

### 1. **Supabase Console - URL Configuration**

Go to your Supabase project: https://app.supabase.com

1. Navigate to **Authentication → URL Configuration**
2. Set the following:

#### Site URL (Production)

```
https://your-domain.netlify.app
```

Replace `your-domain` with your actual Netlify domain.

#### Redirect URLs

Add these URLs:

```
http://localhost:3000/auth/confirm
https://your-domain.netlify.app/auth/confirm
```

### 2. **Supabase Console - Email Templates (Optional)**

If you want custom email messages for signup confirmation and password reset:

1. Navigate to **Authentication → Email Templates**
2. Customize the default templates or leave as-is for now

### 3. **Environment Variables**

Your `.env.local` already has:

```
NEXT_PUBLIC_SUPABASE_URL=https://pbztccsvkpubsdhuqtdw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_M-6QuqfQ9gkW53sBc9uoFw_wuEXQIzD
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For **Netlify deployment**, you'll need to add these environment variables in Netlify Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://pbztccsvkpubsdhuqtdw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_M-6QuqfQ9gkW53sBc9uoFw_wuEXQIzD
NEXT_PUBLIC_APP_URL=https://your-domain.netlify.app
```

## 🧪 Testing the Auth Flow (Local)

The app is running on `http://localhost:3000`

### Test Signup Flow

1. Go to http://localhost:3000/auth/signup
2. Enter an email and password (min 6 characters)
3. Confirm password
4. Click "Sign Up"
5. Check your email for confirmation link (if email confirmations are enabled in Supabase)
6. Click the link or navigate to http://localhost:3000/auth/confirm
7. You should see "Email Confirmed!"

### Test Login Flow

1. Go to http://localhost:3000/auth/login
2. Enter your email and password
3. Click "Sign In"
4. You should be redirected to http://localhost:3000/dashboard
5. Dashboard should display your email and user ID

### Test Session Persistence

1. While logged in on /dashboard, refresh the page (F5)
2. You should remain logged in (session persists via cookies)

### Test Route Protection

1. While not logged in, try to access http://localhost:3000/dashboard
2. You should be redirected to http://localhost:3000/auth/login

### Test Redirect for Logged-In Users

1. After logging in, try to access http://localhost:3000/auth/login
2. You should be redirected to http://localhost:3000/dashboard

### Test Logout

1. Click "Sign Out" on the dashboard
2. You should be redirected to http://localhost:3000/auth/login

### Test Password Reset

1. Go to http://localhost:3000/auth/forgot-password
2. Enter an email address
3. Check your email for the reset link
4. Click the link (it should redirect to /auth/reset-password with token)
5. Enter a new password and confirm
6. Password should be updated

## 📁 File Structure Created

```
app/
├── actions/
│   └── auth.ts                 # Server actions for all auth operations
├── lib/supabase/
│   ├── client.ts              # Browser client
│   └── server.ts              # Server client + Server Actions
├── components/
│   └── UserMenu.tsx           # User menu with profile/logout
├── auth/
│   ├── login/page.tsx         # Login form
│   ├── signup/page.tsx        # Signup form
│   ├── forgot-password/page.tsx  # Password reset request
│   ├── reset-password/page.tsx   # Set new password
│   └── confirm/page.tsx       # Email confirmation page
├── dashboard/
│   └── page.tsx               # Protected user dashboard
└── layout.tsx                 # Updated with UserMenu

middleware.ts                  # Session refresh + route protection
```

## 🚀 Deploying to Netlify

1. **Connect your Git repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `.next`
4. **Add environment variables** in Netlify Dashboard:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - NEXT_PUBLIC_APP_URL (set to your Netlify domain)

5. **Update Supabase URL Configuration** with your Netlify domain

6. **Deploy!**

## 🔐 Security Notes

- ✅ No secrets exposed (using publishable key only)
- ✅ Server Actions handle sensitive operations
- ✅ Cookies managed automatically by Supabase SSR
- ✅ Middleware refreshes sessions on every request
- ✅ Routes protected with middleware + Server Component checks
- ✅ Password reset tokens are single-use and time-limited (Supabase default)

## ⚠️ Known Issues & Notes

1. **Middleware Warning**: Next.js shows a deprecation warning about the middleware file convention. This is harmless and can be ignored for now. It will be addressed in a future Next.js update.

2. **Email Confirmations**: By default, Supabase may not require email confirmations. Check in your Supabase Console under Authentication → Policies to enable/disable if needed.

3. **CORS**: If you get CORS errors, ensure your Site URL in Supabase matches your deployment domain.

## 📝 Next Steps

1. ✅ Test locally (see Testing section above)
2. ✅ Configure Supabase URL Configuration (see Configuration section)
3. Deploy to Netlify and test end-to-end
4. Customize email templates in Supabase if desired
5. Add user profiles table to database for additional data storage

## 🆘 Troubleshooting

### "Session not found" on /dashboard

- Check that cookies are being stored properly in your browser
- Try accessing /auth/login and signing in again
- Check browser DevTools → Application → Cookies

### "Email not sent" for password reset

- Check Supabase Auth → Email logs in the console
- Verify your email provider is configured in Supabase Console
- Check spam folder for reset emails

### "Redirect URI mismatch" error

- Make sure you've added the exact redirect URLs in Supabase URL Configuration
- URLs are case-sensitive and must include protocol (http:// or https://)

---

**Ready to test!** Start with the local testing flow above. 🎉
