# SiteRentals - Heavy Construction Equipment Rental Marketplace

**SiteRentals** is an online marketplace connecting construction contractors, builders, and infrastructure developers with verified equipment owners across India.

Rent **JCBs, crawler excavators, all-terrain mobile cranes, 16-wheel tipper trucks, road rollers, bulldozers, concrete boom pumps, and transit mixers** with transparent pricing and rapid site mobilization.

---

## 🏗️ What Has Been Built & Updated

1. **Phone Number Display Removed**:
   - The phone digits are **completely hidden** from all visible UI text, status bars, action pills, modal popups, and footer sections.
   - Visible buttons and links now state simply: **"WhatsApp"** or **"WhatsApp Us"**.
   - Clicking opens WhatsApp directly with the dedicated coordinator at `+91 7011775286`.

2. **Official Quotation Pass / Ticket System**:
   - Upon submitting a machinery query, the contractor instantly receives an **Official Quotation Ticket Pass** inside a clean, modern modal card.
   - The ticket displays:
     - **SiteRentals Brand Logo** in the ticket header.
     - **Random Unique Ticket ID** (e.g. `SR-TKT-396749`), logged in both `quotes.json` and backend database.
     - **Live Queue Number**: Starts at **`#13`** and automatically increments by **`1`** on every query submission (`#13`, `#14`, `#15`, ...), persisted in `queue_state.json`.
     - **Full Filled Requirement Details**: Contractor Name, Contact Phone, Equipment Requested, Project Site/City, Rental Duration, Mobilization Date, and Site Notes.
     - Security barcode and timestamp.

3. **PDF Ticket Download**:
   - Includes a high-resolution **"Download PDF"** button using client-side `html2pdf.bundle.min.js`.
   - Contractors can download their official pass (`SiteRentals-Ticket-Pass-<QueueNum>-<TicketID>.pdf`) with 1 click directly onto their device.

4. **Email Dispatch to Customer**:
   - A verified HTML copy of the quotation ticket pass is automatically emailed to the customer's submitted email address with full equipment breakdown, queue position, and tracking details.
   - Internal dispatch also routes in the background to `tiwarigopal94@gmail.com`.

5. **WhatsApp Confirmation**:
   - 1-click **"WhatsApp Us"** button on the ticket passes the Ticket ID and Queue Number into WhatsApp chat for immediate priority dispatch.

---

## 🚀 How to Run the Website

```bash
npm start
```
Visit in your browser: **[http://localhost:3000](http://localhost:3000)**
