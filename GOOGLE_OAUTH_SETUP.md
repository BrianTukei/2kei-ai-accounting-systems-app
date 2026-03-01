# Google OAuth Setup Instructions for 2KEI Ledgerly

## ⚠️ IMMEDIATE FIX for "Client missing a project id" Error

You're getting this error because your Google OAuth client is not properly configured. Follow these exact steps:

### 🚨 Quick Fix Steps:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project:**
   - Click the project dropdown at the top
   - If no project exists, click "New Project"
   - Name it "2KEI-Ledgerly" or similar
   - **Important: Note the Project ID that gets generated**

3. **Enable required APIs:**
   - Go to "APIs & Services" → "Library" 
   - Search and enable: "Google+ API" and "People API"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type
   - Fill required fields:
     ```
     App name: 2KEI Ledgerly
     User support email: tukeibrian5@gmail.com
     Developer contact: tukeibrian5@gmail.com
     ```
   - Under Scopes, add: `email`, `profile`, `openid`
   - Add `tukeibrian5@gmail.com` as a test user

5. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "2KEI Ledgerly Web Client"
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost:3000
   https://your-production-domain.com
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:5173/email-confirmation
   http://localhost:3000/email-confirmation
   https://mlsjryicqhxcekmyvtcc.supabase.co/auth/v1/callback
   ```

6. **Copy the Client ID and Secret**

7. **Configure in Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Project: mlsjryicqhxcekmyvtcc
   - Authentication → Providers → Google
   - Enable Google provider
   - Paste your Client ID and Client Secret
   - Set redirect URL to: `https://mlsjryicqhxcekmyvtcc.supabase.co/auth/v1/callback`
   - **Save configuration**

8. **Test immediately:**
   - Clear browser cache
   - Try Google OAuth again

## 🔍 Diagnostic Steps

If you're still getting errors, check these in order:

1. **Verify Project Selection in Google Cloud Console:**
   - Make sure you're in the correct project (check project name in top bar)
   - Verify the project has billing enabled (may be required)

2. **Check OAuth Client Configuration:**
   - Go to Credentials → Your OAuth Client
   - Verify "Client ID" starts with a long number ending in `.apps.googleusercontent.com`
   - Ensure all redirect URIs are exactly correct (no trailing slashes)

3. **Verify Supabase Configuration:**
   - In Supabase Dashboard → Authentication → Providers
   - Make sure Google is enabled (toggle should be ON)
   - Client ID should match exactly from Google Cloud Console
   - Client Secret should be filled in

4. **Test with Browser Console:**
   ```javascript
   // Open browser console and run this to check current config:
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Current origin:', window.location.origin);
   ```

## ⚡ Alternative: Disable Google OAuth Temporarily

If you need immediate access, you can disable Google OAuth:

1. Go to Supabase Dashboard → Authentication → Providers
2. Turn OFF the Google provider
3. Use email/password signup instead:
   - Email: tukeibrian5@gmail.com  
   - Create a password
   - Check email for verification link

## 🆘 Still Having Issues?

**Common causes of "Client missing project id":**
- OAuth client created without selecting a project
- Project billing not enabled
- APIs not properly enabled
- Incorrect redirect URI format

**Quick test:** Try creating a completely new OAuth client in Google Cloud Console with a simple name like "test-client" and see if that works.

**Support Resources:**
- [Google OAuth Troubleshooting](https://developers.google.com/identity/protocols/oauth2/web-server#troubleshooting)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

**If all else fails:** Contact me with screenshots of:
1. Your Google Cloud Console Credentials page
2. Your Supabase Authentication Providers page
3. The exact error message in browser console

## Step 4: Environment Variables

Ensure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=https://mlsjryicqhxcekmyvtcc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 5: Test the Configuration

1. **Start your development server**:
   ```bash
   npm run dev
   ```
2. **Navigate to the auth page**
3. **Try Google OAuth**
4. **Check browser console for any errors**

## Common Issues & Solutions

### 1. Redirect URI Mismatch
- **Error**: `redirect_uri_mismatch`
- **Solution**: Ensure all redirect URIs are correctly added in Google Cloud Console

### 2. Invalid Client
- **Error**: `invalid_client`
- **Solution**: Double-check Client ID and Secret in Supabase dashboard

### 3. Access Blocked
- **Error**: `access_blocked`
- **Solution**: Verify OAuth consent screen is properly configured

### 4. Scope Issues
- **Error**: `invalid_scope`
- **Solution**: Ensure `email`, `profile`, and `openid` scopes are enabled

## Email Verification Setup

The application now automatically sends verification emails when users sign up. To configure this:

1. **Supabase Email Templates** (optional customization):
   - Go to Authentication → Email Templates
   - Customize the "Confirm signup" template
   - Update redirect URL to: `https://your-domain.com/email-confirmation`

2. **SMTP Configuration** (for custom email provider):
   - Go to Settings → Auth
   - Configure SMTP settings if you want to use a custom email provider
   - Otherwise, Supabase handles email delivery automatically

## Testing Email Verification

1. Sign up with a real email address
2. Check your inbox for the verification email
3. Click the verification link
4. You should be redirected to `/email-confirmation` page
5. After successful verification, you'll be redirected to the dashboard

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for all sensitive configuration
- Enable HTTPS in production
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Support

If you continue experiencing issues:
1. Check the browser console for detailed error messages
2. Verify all URLs match exactly (including trailing slashes)
3. Test with an incognito browser window
4. Ensure your domain is properly configured in both Google Cloud Console and Supabase

For additional support, reference:
- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)