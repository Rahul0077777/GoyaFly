[plugin:vite:react-babel] D:\Zaha\frontend-web\src\pages\admin\OTBManager.jsx: Unexpected token (233:71)
  236 |                                         <span className="text-sm font-black">⚡ URGENT (15 MIN)</span>
D:/Zaha/frontend-web/src/pages/admin/OTBManager.jsx:233:71
231 |                          {/* Modal Sidebar - Summary */}
232 |                          <div className="bg-[#1D4171] p-10 md:w-80 text-white flex flex-col justify-be                ...
233 |                                  <h3 className="text-2xl font-black mb-2">{selectedRequest.receiptNumber}</h3>
    |                                                                         ^
234 |                                  {selectedRequest.isUrgent && (
235 |                                      <div className="bg-orange-500 

This document serves as the permanent technical reference for the FTD Travel GDS integration in the Zaha/Goyafly project. It distills all 15 documentation sections into actionable logic.

---

## 1. Authentication (Section 4)
- **Flow**: Authentication is token-based. Tokens are refreshed per session.
- **Headers**:
  - `x-api-key`: Bearer token obtained from FTD.
  - `Content-Type`: `application/json`.

---

## 2. Search & Results (Section 5 & 6)
### Search Request (`postSearchFlightV2`)
- `tripType`: Integer (0 = One Way, 1 = Round Trip, 2 = Multi-City).
- `onDate`: `YYYYMMDD` format (e.g., 20260410).
- `reDate`: Required for RT. `YYYYMMDD`.
- `fareType`: Default `A`.
- `adt`, `chd`, `inf`: Integer passenger counts.

### fareTypeInd Mapping (Critical)
| Value | Label | Category | Color Priority |
|---|---|---|---|
| 0 | SME Fare | SME | Orange |
| 1 | Corporate / Free Fare | Corporate | Purple |
| 2 | Regular / Retail Fare | Retail | Navy |
| 3 | Flexi / Save | Flexi | Green |
| 4 | Business Class | Business | Dark |
| 5 | SpiceMax / Premium Eco | Premium | Red |

---

## 3. Price Verification (Section 7)
- **Mandatory**: Must be called before navigation to Checkout.
- **Logic**:
  - Compares `originalNetfare` with `currentNetfare`.
  - **Yield**: If price changes, the system must prompt the user for confirmation.
  - **SSR Meta**: Returns `ssrInfo` which contains baggage and meal options for the specific flight.

---

## 4. Booking Payload (Section 8 & 9)
### Contact Details
- `mobile`: 10-digit number.
- `mrd`: **Mandatory**. Format: `+91xxxxxxxxxx` (must include country code).
- `email`: Valid passenger/agent email.

### Passenger Data
- `pType`: **A** (Adult), **C** (Child), **I** (Infant).
- `title`: 
  - Adult: Mr, Mrs, Ms.
  - Child/Infant: Mstr, Miss.
- `dob`: **Mandatory**. Format: `DD-MM-YYYY`.
- `gender`: M / F.

### International Reqs (Section 15)
- Passport fields are **Mandatory** for international routes:
  - `ppNo`: Passport Number.
  - `ppIss`: Issue Date (`DD-MM-YYYY`).
  - `ppExp`: Expiry Date (`DD-MM-YYYY`).
  - `ppNat`: Nationality code (e.g., `IN`).

---

## 5. SSR (Baggage & Meals) (Section 9 & 10)
### JSON Structure
`Baggage.Onward` (and `Baggage.Return` for RT):
```json
{
  "seat_no": "6A",
  "seat_amount": "0",
  "meal": "VGML",
  "meal_amount": "0"
}
```
- Amounts must be strings.
- `seat_no` is obtained from the `Onward.row[]` array in the Section 10 Seat Map response.

---

## 6. Success & Ticketing (Section 13)
- **Status Polling**: FTD may return `Status: PENDING`. Polling Section 13 is required for final confirmation.
- **Ticket Node**:
  - `pnr`: Airline PNR.
  - `TicketNo`: E-ticket number (unique per passenger).
  - `barcodeText1`: Used for generating ticket barcodes.

---

## 7. Fare Rules (Section 14)
- The API may return rules in two formats:
  - `htmlData`: A raw string of HTML rules.
  - `policy`: A JSON object with structured cancellation/reschedule details.
- Implementation must support both.

---

## 8. Development Notes
- **LCC vs GDS**: All implementations for FTD assume GDS-style strictness (DOB and Title enforcement).
- **Wallet Integration**: All bookings in this repo assume `paymentMethod: 'WALLET'`.
- **Idempotency**: Use `refID` to prevent duplicate bookings during network retries.
