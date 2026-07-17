// ============================================================
// APP VERSION — SINGLE SOURCE OF TRUTH
// ============================================================
// Versioning scheme (pre-release): 0.MINOR.PATCH-beta
// Rules:
//   - Increment MINOR for every production deploy with new features/behavior changes
//   - Increment PATCH for hotfixes only (no state or layout changes)
//   - Change to 1.0.0 when going live to the public
//
// HOW TO RELEASE:
//   1. Increment this version number
//   2. Run: npm run build
//   3. Deploy to Azure App Service
//   4. (Optional) Update MinTokenDate in DB via SQL to force API-level logout
// ============================================================

export const APP_VERSION = '1.3.0';

