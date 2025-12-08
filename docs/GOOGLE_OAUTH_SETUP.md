# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth and Calendar API access for the Zeno Meeting Prep application.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown in the top bar
3. Click **"New Project"**
4. Enter project details:
   - **Project name**: `Zeno Meeting Prep` (or your preferred name)
   - **Organization**: Leave as default (No organization)
5. Click **"Create"**
6. Wait for the project to be created (takes a few seconds)
7. Select your new project from the dropdown

### 2. Enable Google Calendar API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. In the search box, type: `Google Calendar API`
3. Click on **Google Calendar API** from the results
4. Click the blue **"Enable"** button
5. Wait for the API to be enabled

### 3. Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **User Type**:
   - Choose **External** (unless you have a Google Workspace organization)
   - Click **"Create"**

#### App Information (Page 1)
Fill in the required fields:
- **App name**: `Zeno Meeting Prep`
- **User support email**: Select your email from dropdown
- **App logo**: (Optional - can skip for now)
- **Application home page**: `http://localhost:3000` (for development)
- **Application privacy policy link**: (Optional - required for production)
- **Application terms of service link**: (Optional - required for production)
- **Authorized domains**: Leave empty for now (add your production domain later)
- **Developer contact information**: Enter your email address

Click **"Save and Continue"**

#### Scopes (Page 2)
1. Click **"Add or Remove Scopes"**
2. In the filter box, search for and select these scopes:

**Required Scopes:**
- `https://www.googleapis.com/auth/calendar.readonly` - View your calendars
- `https://www.googleapis.com/auth/calendar.events.readonly` - View events on all your calendars
- `.../auth/userinfo.email` - See your primary Google Account email address
- `.../auth/userinfo.profile` - See your personal info

3. Click **"Update"** at the bottom
4. Verify all 4 scopes appear in the table
5. Click **"Save and Continue"**

#### Test Users (Page 3)
1. Click **"+ Add Users"**
2. Enter your email address (and any other developers' emails)
3. Click **"Add"**
4. Click **"Save and Continue"**

#### Summary (Page 4)
1. Review all the information
2. Click **"Back to Dashboard"**

**Important**: Your app is now in "Testing" mode. Only test users you added can log in. For production use, you'll need to publish the app (see Production section below).

### 4. Create OAuth 2.0 Credentials

1. In the left sidebar, go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**
4. Configure the OAuth client:

**Application type**: Web application

**Name**: `Zeno Meeting Prep Web Client`

**Authorized JavaScript origins**:
- Click **"+ Add URI"**
- Add: `http://localhost:3000` (for local development)
- Add: `https://yourdomain.com` (for production, when ready)

**Authorized redirect URIs**:
- Click **"+ Add URI"**
- Add: `http://localhost:3000/api/auth/callback/google` (for local development)
- Add: `https://yourdomain.com/api/auth/callback/google` (for production, when ready)

5. Click **"Create"**

### 5. Copy Your Credentials

A popup will appear with your credentials:

```
Client ID: something.apps.googleusercontent.com
Client Secret: GOCSPX-xxxxxxxxxxxxxxxx
```

**Important**: Copy both values immediately. You can always access them later from the Credentials page, but it's easier to copy them now.

### 6. Add Credentials to Your Application

1. Open your project's `.env.local` file
2. Add or update these lines:

```bash
# Google OAuth & Calendar API
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

3. Replace `your-client-id-here` with your actual Client ID
4. Replace `your-client-secret-here` with your actual Client Secret
5. Save the file

**Security Note**: Never commit `.env.local` to git. It's already in `.gitignore`.

## Testing Your Setup

### 1. Verify Environment Variables

```bash
# From your project root
cat .env.local | grep GOOGLE
```

You should see both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with values.

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test OAuth Flow

Once User Story 3 (Campaign Setup) is implemented:

1. Navigate to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. You should see the Google OAuth consent screen
4. Grant the requested permissions
5. You should be redirected back to the application

### Expected Behavior

**First time logging in**:
- Google will show: "Zeno Meeting Prep wants to access your Google Account"
- You'll see a list of requested permissions (calendar access, email, profile)
- A warning: "Google hasn't verified this app" (normal for testing mode)
- Click "Continue" (only works for test users you added)

**Subsequent logins**:
- Google may skip the consent screen if you've already granted permission
- You'll be logged in immediately

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your app doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Check your redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
2. No trailing slash
3. Must use `http://` for localhost (not `https://`)
4. Port number must match (default is 3000)

### Error: "access_denied" or "invalid_scope"

**Cause**: OAuth scopes weren't properly configured.

**Solution**:
1. Go back to OAuth consent screen in Google Cloud Console
2. Verify all 4 required scopes are added
3. Click "Save and Continue"
4. Wait a few minutes for changes to propagate

### Warning: "This app isn't verified"

**This is normal for development**. Only test users can proceed. See Production section below for verification process.

### Can't log in / "Access blocked"

**Cause**: You're not added as a test user.

**Solution**:
1. Go to OAuth consent screen → Test users
2. Add your email address
3. Try logging in again

## Production Deployment

### Before Going to Production

1. **Add Production URLs**:
   - Go to Credentials → Edit your OAuth client
   - Add authorized origins: `https://yourdomain.com`
   - Add redirect URI: `https://yourdomain.com/api/auth/callback/google`
   - Save changes

2. **Add Required Pages** (to your deployed site):
   - Privacy Policy page
   - Terms of Service page
   - Homepage with clear description

3. **Update OAuth Consent Screen**:
   - Go to OAuth consent screen → Edit app registration
   - Add privacy policy URL
   - Add terms of service URL
   - Add your production domain to authorized domains
   - Save

### OAuth App Verification

To remove the "unverified app" warning and allow any Google user to log in:

1. Go to **OAuth consent screen**
2. Click **"Publish App"**
3. Click **"Prepare for Verification"**
4. Submit verification request with:
   - Links to privacy policy and terms of service
   - Explanation of why you need calendar access
   - Demo video showing the app's functionality
   - Homepage URL

**Timeline**: Google's review process typically takes 3-7 business days.

**Alternative**: If you only need a small number of users (< 100), you can stay in "Testing" mode and manually add each user as a test user.

## Security Best Practices

1. **Never commit credentials to git**
   - `.env.local` is in `.gitignore` by default
   - Use environment variables in production (Vercel, etc.)

2. **Rotate credentials if exposed**
   - If credentials are accidentally committed, create new ones immediately
   - Delete the compromised credentials in Google Cloud Console

3. **Use separate credentials for dev/production**
   - Consider creating two OAuth clients (one for dev, one for prod)
   - This allows independent rotation and monitoring

4. **Monitor API usage**
   - Check Google Cloud Console → APIs & Services → Dashboard
   - Set up usage alerts to detect unusual activity

## Rate Limits & Quotas

Google Calendar API has the following limits:

- **Queries per day**: 1,000,000 (default)
- **Queries per 100 seconds per user**: 50,000
- **Queries per 100 seconds**: 50,000

These limits are generous for most use cases. Monitor your usage in the Google Cloud Console.

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [NextAuth.js Google Provider Docs](https://authjs.dev/getting-started/providers/google)
- [OAuth 2.0 Verification FAQ](https://support.google.com/cloud/answer/9110914)

## Support

If you encounter issues:

1. Check the [Google Cloud Console](https://console.cloud.google.com/) for error messages
2. Review the troubleshooting section above
3. Check NextAuth.js logs in your terminal
4. Review the application logs in your browser's developer console

## Revision History

- **2025-12-09**: Initial setup guide created
