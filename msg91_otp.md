# MSG91 Secure OTP Widget Integration Documentation

This document outlines the complete step-by-step implementation and integration details for the MSG91 Secure OTP Widget used in the Billing Pro application.

## 1. Overview
The application uses the **MSG91 Secure OTP Web SDK** strictly on the frontend (React/Vite) to handle OTP generation, invisible Captcha security, and OTP SMS delivery. The Node.js backend is ONLY responsible for verifying the final access token returned by MSG91 upon successful OTP verification.

**Benefits of this Architecture:**
- Bypasses the need to handle raw OTPs on the server.
- Uses MSG91's built-in Invisible Captcha to prevent spam.
- Keeps sensitive credentials (`MSG91_AUTH_KEY`) completely hidden from the frontend.

---

## 2. Configuration & Credentials

### Frontend (React)
The frontend requires the **Widget ID** and **Token Auth**. These are configured via environment variables `VITE_MSG91_WIDGET_ID` and `VITE_MSG91_TOKEN_AUTH`.
- **Widget ID**: `<YOUR_MSG91_WIDGET_ID>`
- **Token Auth**: `<YOUR_MSG91_TOKEN_AUTH>`

### Backend (Node.js)
The backend uses the **AuthKey**. This must remain secret and is stored in the `.env` file.
- **MSG91_AUTH_KEY**: `<Your Secret Auth Key>`

---

## 3. Frontend Implementation Steps (`Login.jsx`)

### Step 3.1: SDK Loading (Polling Mechanism)
The MSG91 SDK script (`otp-provider.js`) is injected dynamically when the `Login` component mounts. 
Instead of relying on the standard `onload` event (which can fire before the SDK has fully attached its methods to the global `window` object), the app uses a robust polling mechanism.
It checks for `window.initSendOTP` every 500ms. Once found, it marks the application state as `sdkReady = true`.

### Step 3.2: Widget Initialization
When the user enters their 10-digit mobile number and clicks "Continue", the widget is initialized:
```javascript
window.configuration = {
  widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
  tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH,
  identifier: "919876543210",
  exposeMethods: true, // MUST be a boolean, NOT a string "true"
  success: async (data) => {
    // Triggers when OTP is successfully verified.
    // data.message contains the MSG91 Access Token to send to the backend.
  },
  failure: (error) => {
    // Global failure callback
  }
};

window.initSendOTP(window.configuration);
```
**Important:** `exposeMethods: true` is required to suppress the default MSG91 popup UI and allow us to use our custom React UI.

### Step 3.3: Sending OTP (`window.sendOtp`)
After initialization, the app waits for the `window.sendOtp` method to become available, then calls it.
```javascript
window.sendOtp(
  mobileNumber,
  (successData) => { /* Move to Step 2 UI */ },
  (errorData) => { /* Handle actual send failure */ }
);
```

**Captcha Fallback Handling:** 
In local development environments (like `localhost` or local IPs), MSG91's hCaptcha might throw an "Invalid Captcha Token" error to the global `failure` callback. However, MSG91 has a fallback mechanism that *still delivers the OTP SMS*. 
Therefore, the application intercepts and ignores "Captcha" warnings in the global failure callback during the initial send phase to prevent the UI from getting stuck, allowing the customer to enter the OTP they received.

### Step 3.4: Verifying OTP (`window.verifyOtp`)
When the user inputs the OTP, the frontend passes it to MSG91.
```javascript
window.verifyOtp(
  mobileNumber, // Identifier MUST be passed
  otp,          // The 4/6 digit code
  (successData) => { /* Triggers the global success config */ },
  (errorData) => { /* Show "Invalid OTP" */ }
);
```
If verification succeeds, the global `success` callback defined in `window.configuration` executes.

---

## 4. Backend Implementation Steps (Node.js)

When MSG91 verifies the OTP on the frontend, it returns an **Access Token**. The frontend sends this Access Token to the backend route `POST /api/auth/verify-msg91`.

The backend makes an internal HTTP request to MSG91's API to confirm the token is valid and hasn't been tampered with.

**Endpoint:** `GET https://api.msg91.com/api/v5/widget/verifyAccessToken`
**Headers Required:**
- `authkey`: `process.env.MSG91_AUTH_KEY`
- `access-token`: `<Token from Frontend>`

If MSG91 confirms the token is valid, the Node.js backend issues the Billing Pro application JWT and the user is logged in.

---

## 5. Critical UI Behaviors Implemented
1. **Duplicate Request Prevention**: The "Continue" and "Verify" buttons are instantly disabled (`loading=true`) upon click to prevent double SMS dispatch.
2. **Resend Timer**: A 60-second countdown runs on the OTP screen before exposing the "Resend OTP" button.
3. **Change Number**: Users can reset the state, wipe the timer, and return to Step 1 to enter a different mobile number.
4. **Timeouts**: The Verification step includes a 15-second watchdog timer. If MSG91 hangs (network drop), it times out gracefully rather than spinning infinitely.
