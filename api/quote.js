/**
 * Vercel Serverless Function: POST /api/quote
 * Generates quotation ticket, increments queue starting at 13,
 * and emails formatted ticket to customer and central desk.
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const QUEUE_FILE = isVercel
  ? path.join('/tmp', 'queue_state.json')
  : path.join(__dirname, '..', 'queue_state.json');
const QUOTES_FILE = isVercel
  ? path.join('/tmp', 'quotes.json')
  : path.join(__dirname, '..', 'quotes.json');

const TARGET_INTERNAL_EMAIL = 'tiwarigopal94@gmail.com';

let inMemoryQueue = 13;

function getAndIncrementQueue() {
  try {
    let current = 13;
    if (fs.existsSync(QUEUE_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8') || '{}');
      current = data.currentQueueNumber || 13;
      data.currentQueueNumber = current + 1;
      data.totalSubmissions = (data.totalSubmissions || 0) + 1;
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(data, null, 2), 'utf8');
      inMemoryQueue = current + 1;
      return current;
    } else {
      fs.writeFileSync(QUEUE_FILE, JSON.stringify({ currentQueueNumber: 14, totalSubmissions: 1 }, null, 2), 'utf8');
      inMemoryQueue = 14;
      return 13;
    }
  } catch (err) {
    const val = inMemoryQueue;
    inMemoryQueue += 1;
    return val;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(QUOTES_FILE)) {
        const quotes = JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf8') || '[]');
        return res.status(200).json(quotes);
      }
      return res.status(200).json([]);
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    } = req.body || {};

    const assignedTicketId = ticketId || `SR-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const assignedQueueNumber = getAndIncrementQueue();
    const formattedTimestamp = timestamp || new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

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
      timestamp: formattedTimestamp,
      status: 'IN_QUEUE'
    };

    // Save ticket locally / to /tmp
    try {
      let list = [];
      if (fs.existsSync(QUOTES_FILE)) {
        list = JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf8') || '[]');
      }
      list.unshift(newTicket);
      fs.writeFileSync(QUOTES_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.warn('Ticket persistence notice:', e.message);
    }

    // HTML Email Template for Ticket Pass
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

        // 1. Send to internal dispatch desk
        await transporter.sendMail({
          from: `"SiteRentals Dispatch" <${smtpUser}>`,
          to: TARGET_INTERNAL_EMAIL,
          subject: `[SiteRentals Pass #${newTicket.queueNumber}] ${newTicket.equipment} for ${newTicket.name} (${newTicket.location})`,
          html: ticketHtml
        });

        // 2. Send copy to customer
        if (newTicket.email && newTicket.email.includes('@')) {
          await transporter.sendMail({
            from: `"SiteRentals Pass" <${smtpUser}>`,
            to: newTicket.email,
            subject: `Your SiteRentals Official Quotation Pass #${newTicket.queueNumber} (${newTicket.ticketId})`,
            html: ticketHtml
          });
        }

        emailDispatched = true;
        console.log(`✅ Ticket #${newTicket.queueNumber} emailed successfully!`);
      } catch (mailErr) {
        console.error('Mail dispatch error:', mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      ticket: newTicket,
      emailDispatched
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
