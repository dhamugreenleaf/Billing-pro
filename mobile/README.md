# GoBill Mobile Application (Android & iOS)

A dedicated, native mobile application for **GoBill — GST Billing & Business Invoicing** built with React Native and Expo (JavaScript only). Communicates directly with the GoBill Node.js + Express + PostgreSQL backend.

---

## 1. Prerequisites

- **Node.js**: v18.x or v20.x+
- **Expo CLI / EAS CLI**:
  ```bash
  npm install -g eas-cli
  ```
- **Mobile Testing**:
  - **Android**: Android Studio emulator or Android device with [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) installed.
  - **iOS**: Xcode simulator (macOS) or iPhone with [Expo Go](https://apps.apple.com/app/expo-go/id982107779) installed.

---

## 2. Installation & Quick Start

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run Expo Doctor to verify system & package health:
   ```bash
   npx expo-doctor
   ```

4. Start the Expo development server:
   ```bash
   npm start
   ```

5. Run on Android or iOS:
   - Press `a` in the terminal to launch the Android emulator.
   - Press `i` to launch the iOS simulator (macOS only).
   - Scan the terminal QR code with **Expo Go** on your physical phone.

---

## 3. Environment & Backend Configuration

Create a `.env` file in `mobile/` based on `.env.example`:

```bash
cp .env.example .env
```

### Configuration Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Base HTTP endpoint for GoBill Backend API | `https://gobill.gldatacenter.com/api` |

### Development Connectivity Tips

- **Android Studio Emulator**: Use `http://10.0.2.2:5000/api` (points to `localhost:5000` on your host PC).
- **Physical Phone (Expo Go)**: Ensure phone and PC are on the same Wi-Fi network and use your computer's LAN IP, e.g. `http://192.168.1.XX:5000/api`.
- **Production**: Uses `https://gobill.gldatacenter.com/api`.

---

## 4. Testing

Run automated logic, validation, and compliance tests:

```bash
npm test
```

Verifies:
- Phone number sanitization and country-code normalization.
- Dynamic GST calculation (Intra-state CGST+SGST vs Inter-state IGST).
- Payment status derivation and balance tracking.
- GoBill subscription quotas and usage tracking.
- Fetch API error resilience and 401 interceptors.
- App Store & Google Play in-app digital payment compliance.

---

## 5. Mobile Features & Screens

1. **Authentication**:
   - Phone number entry with automatic `+91` normalization.
   - 6-digit OTP verification with 60s cooldown timer.
   - Secure JWT storage via `expo-secure-store` with session restoration.
2. **Dashboard**:
   - Total Sales, Pending Dues, Invoices Count, and Customer Count.
   - Real-time monthly bill usage progress bar.
   - Quick action shortcuts (`+ Create Bill`, `Products`, `Customers`, `Reports`).
   - Recent 5 invoices list.
3. **Invoices**:
   - Filter by All, Paid, Partial, and Unpaid.
   - Real-time search by bill number, customer name, or phone.
   - Itemized invoice details with full GST breakdown.
   - Record payment modal with instant balance recalculation.
4. **Create Invoice**:
   - Customer autofill by 10-digit mobile number or inline creation.
   - State selector (all 36 Indian states & union territories).
   - Product catalog picker with stock levels.
   - Live tax preview (CGST+SGST vs IGST).
   - Payment collection toggles (Full, Partial, Unpaid).
5. **Products**:
   - Catalog list with low stock warnings.
   - Add and Edit product modals with selling price, SKU, category, and tax rate.
6. **Customers**:
   - Client directory with contact numbers, addresses, and GSTINs.
7. **Reports**:
   - Total sales revenue, collection percentage, and pending receivables.
8. **Subscription Plans**:
   - Free (10 bills), Basic (1,500 bills), Pro (2,500 bills).
   - In-app Store compliant account management notice directing web portal upgrades.

---

## 6. Google Play Store & Apple App Store Production Releases

The application is pre-configured with:
- **Android Package**: `com.gobill.billing`
- **iOS Bundle Identifier**: `com.gobill.billing`
- **App Scheme**: `gobill`
- **EAS Build Configuration**: `eas.json`

### Android Releases

1. **Build APK for Internal Testing**:
   ```bash
   eas build --platform android --profile preview
   ```
2. **Build Production Android App Bundle (.aab)**:
   ```bash
   eas build --platform android --profile production
   ```
3. Upload the `.aab` to **Google Play Console** under Internal Testing or Production track.

### iOS Releases

1. Log in to your Apple Developer Account:
   ```bash
   eas login
   ```
2. **Build Production IPA for App Store / TestFlight**:
   ```bash
   eas build --platform ios --profile production
   ```
3. Submit build directly to **TestFlight**:
   ```bash
   eas submit --platform ios
   ```

---

## 7. App Store & Google Play Policy Compliance

- In compliance with **Apple App Store Review Guideline 3.1.1 & 3.1.3(c)** and Google Play Billing policies, in-app digital tier upgrades are synchronized transparently with the user's SaaS account via the web portal rather than injecting unauthorized third-party checkout WebViews.
- All network requests are secured over HTTPS in production.
- Sensitive authentication tokens are stored exclusively inside hardware-backed secure storage (`expo-secure-store`).
