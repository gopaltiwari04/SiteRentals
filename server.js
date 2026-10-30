/**
 * SiteRentals - Local Express Server
 * Serves static assets, manages queue state starting at 13,
 * and handles quotation ticket creation & email dispatch.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const QUOTES_FILE = path.join(__dirname, 'quotes.json');
const QUEUE_FILE = path.join(__dirname, 'queue_state.json');
const TARGET_INTERNAL_EMAIL = 'tiwarigopal94@gmail.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize files
if (!fs.existsSync(QUOTES_FILE)) {
  fs.writeFileSync(QUOTES_FILE, JSON.stringify([], null, 2), 'utf8');
}
if (!fs.existsSync(QUEUE_FILE)) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify({ currentQueueNumber: 13, totalSubmissions: 0 }, null, 2), 'utf8');
}

function getNextQueueNumber() {
  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
    const data = JSON.parse(raw || '{"currentQueueNumber":13,"totalSubmissions":0}');
    const assigned = data.currentQueueNumber || 13;
    data.currentQueueNumber = assigned + 1;
    data.totalSubmissions = (data.totalSubmissions || 0) + 1;
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2), 'utf8');
    return assigned;
  } catch (e) {
    return 13;
  }
}

function peekCurrentQueueNumber() {
  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
    const data = JSON.parse(raw || '{"currentQueueNumber":13}');
    return data.currentQueueNumber || 13;
  } catch (e) {
    return 13;
  }
}

// Queue Number endpoint
app.get('/api/queue-number', (req, res) => {
  res.json({ currentQueueNumber: peekCurrentQueueNumber() });
});

// Quote submission endpoint
app.post('/api/quote', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      equipment,
      location,
      duration,
      startDate,
      notes,
      ticketId,
      timestamp
    } = req.body;

    const assignedTicketId = ticketId || `SR-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const assignedQueueNumber = getNextQueueNumber();

    const newTicket = {
      ticketId: assignedTicketId,
      queueNumber: assignedQueueNumber,
      name: name || 'Valued Contractor',
      phone: phone || 'Not provided',
      email: email || '',
      equipment: equipment || 'Heavy Construction Equipment',
      location: location || 'India',
      duration: duration || 'Flexible',
      startDate: startDate || 'Immediate Mobilization',
      notes: notes || 'No special requirements noted',
      timestamp: timestamp || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      status: 'IN_QUEUE'
    };

    console.log('\n========================================');
    console.log('🎫 SITERENTALS QUOTATION TICKET CREATED:');
    console.log(`Ticket ID: ${newTicket.ticketId}`);
    console.log(`Queue Position: #${newTicket.queueNumber}`);
    console.log(`Contractor: ${newTicket.name} (${newTicket.phone})`);
    console.log(`Email: ${newTicket.email}`);
    console.log(`Equipment: ${newTicket.equipment}`);
    console.log('========================================\n');

    // Save ticket locally
    try {
      const existingData = fs.readFileSync(QUOTES_FILE, 'utf8');
      const quotesList = JSON.parse(existingData || '[]');
      quotesList.unshift(newTicket);
      fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotesList, null, 2), 'utf8');
    } catch (saveErr) {
      console.error('Error saving quote ticket locally:', saveErr.message);
    }

    // HTML Email Template
    const ticketHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #FFFFFF; border: 2px solid #DC2626; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <div style="background: #0F172A; padding: 24px 28px; border-bottom: 4px solid #DC2626; color: #FFFFFF;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">
                  SITE<span style="color: #DC2626;">RENTALS</span>
                </h1>
                <p style="margin: 4px 0 0; font-size: 11px; letter-spacing: 3px; color: #94A3B8; text-transform: uppercase;">
                  Heavy Equipment Marketplace • Pan India
                </p>
              </td>
              <td align="right">
                <span style="display: inline-block; background: #DC2626; color: #FFFFFF; font-size: 11px; font-weight: bold; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                  Official Quotation Pass
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #FEF2F2; padding: 20px 28px; border-bottom: 1px solid #FEE2E2; text-align: center;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 2px;">
            Your Live Position in Queue
          </p>
          <div style="font-size: 46px; font-weight: 900; color: #991B1B; margin: 4px 0;">
            #${newTicket.queueNumber}
          </div>
          <p style="margin: 0; font-size: 12px; color: #4B5563;">
            Priority Dispatch Active • Average Response: ~12 Mins
          </p>
        </div>

        <div style="padding: 20px 28px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 13px;">
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color: #64748B;">Ticket ID:</td>
              <td style="font-weight: bold; color: #0F172A; text-align: right;">${newTicket.ticketId}</td>
            </tr>
            <tr>
              <td style="color: #64748B;">Issued On:</td>
              <td style="font-weight: 600; color: #0F172A; text-align: right;">${newTicket.timestamp}</td>
            </tr>
            <tr>
              <td style="color: #64748B;">Status:</td>
              <td style="font-weight: bold; color: #16A34A; text-align: right;">🟢 IN QUEUE - VERIFIED</td>
            </tr>
          </table>
        </div>

        <div style="padding: 28px;">
          <h3 style="margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px;">
            Requirement Breakdown
          </h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; line-height: 1.6;">
            <tr>
              <td width="35%" style="color: #64748B; font-weight: 600;">Contractor:</td>
              <td style="color: #0F172A; font-weight: bold;">${newTicket.name}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 600;">Mobile:</td>
              <td style="color: #0F172A;">${newTicket.phone}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 600;">Equipment:</td>
              <td style="color: #DC2626; font-weight: bold;">${newTicket.equipment}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 600;">Project Site:</td>
              <td style="color: #0F172A; font-weight: 600;">${newTicket.location}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 600;">Rental Duration:</td>
              <td style="color: #0F172A;">${newTicket.duration}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 600;">Mobilization Date:</td>
              <td style="color: #0F172A;">${newTicket.startDate}</td>
            </tr>
            <tr>
              <td style="color: #64748B; font-weight: 600;">Notes:</td>
              <td style="color: #334155;">${newTicket.notes}</td>
            </tr>
          </table>
        </div>

        <div style="background: #0F172A; color: #94A3B8; padding: 20px 28px; text-align: center; font-size: 11px;">
          <p style="margin: 0 0 6px; color: #FFFFFF; font-weight: bold;">
            SiteRentals Technologies Pvt. Ltd. • Pan-India Heavy Equipment Network
          </p>
          <p style="margin: 0;">
            To check live status or speed up dispatch, quote this Ticket ID on WhatsApp.
          </p>
        </div>
      </div>
    `;

    let emailDispatched = false;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '465', 10),
          secure: (process.env.SMTP_PORT || '465') === '465',
          auth: { user: smtpUser, pass: smtpPass }
        });

        await transporter.sendMail({
          from: `"SiteRentals Dispatch" <${smtpUser}>`,
          to: TARGET_INTERNAL_EMAIL,
          subject: `[SiteRentals Pass #${newTicket.queueNumber}] ${newTicket.equipment} for ${newTicket.name} (${newTicket.location})`,
          html: ticketHtml
        });

        if (newTicket.email && newTicket.email.includes('@')) {
          await transporter.sendMail({
            from: `"SiteRentals Pass" <${smtpUser}>`,
            to: newTicket.email,
            subject: `Your SiteRentals Official Quotation Pass #${newTicket.queueNumber} (${newTicket.ticketId})`,
            html: ticketHtml
          });
        }
        emailDispatched = true;
      } catch (err) {
        console.error('Nodemailer error:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      ticket: newTicket,
      emailDispatched
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Quotes archive
app.get('/api/quotes', (req, res) => {
  try {
    const data = fs.readFileSync(QUOTES_FILE, 'utf8');
    res.json(JSON.parse(data || '[]'));
  } catch (err) {
    res.status(500).json({ error: 'Could not read quotes archive' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SiteRentals Heavy Equipment Platform',
    currentQueueNumber: peekCurrentQueueNumber(),
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 SiteRentals Platform is running live!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📁 Queue system active starting at #13.\n`);
});
