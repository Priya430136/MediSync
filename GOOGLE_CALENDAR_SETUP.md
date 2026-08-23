# Google Calendar API & OAuth 2.0 Integration Setup Guide

This guide details how to configure Google Cloud Platform (GCP), OAuth 2.0 Consent Screen, credentials, scopes, and environment variables for MediSync's bidirectional Google Calendar integration.

---

## 1. Google Cloud Project Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one (e.g., `medisync-healthcare` or `gen-lang-client-0614011709`).
3. Enable the **Google Calendar API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Google Calendar API**.
   - Click **Enable**.

---

## 2. OAuth Consent Screen Configuration

1. In Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **User Type**:
   - Choose **External** (for patient & public user access) or **Internal** (if restricted to Google Workspace organization).
3. Fill in the App Information:
   - **App name**: `MediSync Healthcare`
   - **User support email**: `support@medisync-health.com` (or your developer email)
   - **Developer contact information**: Your email address
4. Click **Save and Continue**.

---

## 3. Required Google Calendar Scopes

Under the **Scopes** step in the OAuth Consent Screen:
- Click **Add or Remove Scopes**.
- Add the following required Calendar scope:
  - `https://www.googleapis.com/auth/calendar.events` (View and edit events on all your calendars)
  - `https://www.googleapis.com/auth/calendar` (Optional: Full access for managing secondary clinic calendars)
- User profile scopes (optional/recommended for identity):
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`

---

## 4. OAuth 2.0 Credentials (Client ID & Client Secret)

1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Select **Application type**:
   - For Web Client: **Web application**
4. Set Name: `MediSync Web App`
5. Configure **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `https://your-production-domain.run.app`
6. Configure **Authorized redirect URIs**:
   - `http://localhost:3000/api/calendar/oauth/callback`
   - `https://your-production-domain.run.app/api/calendar/oauth/callback`
7. Click **Create**.
8. Copy the generated **Client ID** and **Client Secret**.

---

## 5. Environment Variables Configuration

Add the following variables to your `.env` and `.env.example` files:

```env
# Google Calendar & OAuth 2.0 Integration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 6. Integration Lifecycle & Behavior

| Event | Action on Patient Calendar | Action on Doctor Calendar | Idempotency Guarantee | Error Isolation |
|---|---|---|---|---|
| **Appointment Booked** | Creates Event with Clinic Location & Pre-visit Summary | Creates Event with Patient Info & AI Chief Complaint | Uses `gcal_create_{aptId}_{role}` to prevent duplicate events on retry | Non-blocking: Booking succeeds even if Calendar API is down |
| **Appointment Rescheduled** | Updates date/time & adds reschedule notes | Updates date/time in physician schedule | Patches existing event ID in-place | Non-blocking: Reschedule persists, flags Calendar for retry |
| **Appointment Cancelled** | Deletes/cancels event | Deletes event & frees physician slot | Removes event and updates event log to `deleted` | Non-blocking: Cancellation persists safely |
| **Token Expiry** | Auto-refreshes using `refreshToken` | Auto-refreshes using `refreshToken` | Seamless background token renewal | If refresh fails, user is flagged for one-click reauth |
