/**
 * SiteRentals - Core Interactive Engine
 * Handles Dynamic Logo Intro, Equipment Collage Slider, Scroll Showcase,
 * Quotation Dispatch, Queue Number Management, and Robust Vector PDF Ticket Generation.
 */

let currentTicket = null;
let localQueueCounter = parseInt(localStorage.getItem('siterentals_queue_num') || '13', 10);

document.addEventListener('DOMContentLoaded', () => {
  initIntroAnimation();
  initCollageSlider();
  initScrollShowcase();
  initQuotationForm();
  initCounters();
  syncQueueNumberWithServer();
});

/* ==========================================================================
   1. QUEUE NUMBER MANAGEMENT (STARTS AT 13, INCREMENTS BY 1)
   ========================================================================== */
async function syncQueueNumberWithServer() {
  try {
    const res = await fetch('/api/queue-number');
    if (res.ok) {
      const data = await res.json();
      if (data && data.currentQueueNumber) {
        localQueueCounter = Math.max(localQueueCounter, data.currentQueueNumber);
        localStorage.setItem('siterentals_queue_num', localQueueCounter.toString());
      }
    }
  } catch (e) {
    // Graceful offline fallback
  }
}

/* ==========================================================================
   2. INTRO SCREEN & LOGO ANIMATION (GLIDES DIRECTLY TO TOP-LEFT)
   ========================================================================== */
function initIntroAnimation() {
  const introScreen = document.getElementById('intro-screen');
  const introLogo = document.getElementById('intro-logo-container');
  const navbar = document.getElementById('main-navbar');
  const navLogo = document.getElementById('navbar-brand-logo');
  const skipBtn = document.getElementById('skip-intro-btn');

  let hasAnimated = false;

  function triggerIntroFly() {
    if (hasAnimated) return;
    hasAnimated = true;

    // Apply the fly-to-nav CSS class which smoothly moves logo to top-left (18px, 24px)
    if (introLogo) {
      introLogo.classList.add('fly-to-nav');
    }

    setTimeout(() => {
      if (introScreen) {
        introScreen.classList.add('fade-out');
      }
      if (navbar) {
        navbar.classList.remove('opacity-0', '-translate-y-4');
        navbar.classList.add('opacity-100', 'translate-y-0');
      }
    }, 450);

    setTimeout(() => {
      if (introLogo) {
        introLogo.style.opacity = '0';
        introLogo.style.visibility = 'hidden';
      }
      if (navLogo) {
        navLogo.style.opacity = '1';
      }
      document.body.classList.remove('overflow-hidden');
    }, 1100);
  }

  document.body.classList.add('overflow-hidden');

  if (navLogo) {
    navLogo.style.opacity = '0';
    navLogo.style.transition = 'opacity 0.3s ease';
  }

  const autoFlyTimer = setTimeout(() => {
    triggerIntroFly();
  }, 1500);

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearTimeout(autoFlyTimer);
      triggerIntroFly();
    });
  }

  if (introScreen) {
    introScreen.addEventListener('click', () => {
      clearTimeout(autoFlyTimer);
      triggerIntroFly();
    });
  }

  window.addEventListener('wheel', () => {
    if (!hasAnimated) {
      clearTimeout(autoFlyTimer);
      triggerIntroFly();
    }
  }, { once: true, passive: true });

  window.addEventListener('touchmove', () => {
    if (!hasAnimated) {
      clearTimeout(autoFlyTimer);
      triggerIntroFly();
    }
  }, { once: true, passive: true });
}

/* ==========================================================================
   3. EQUIPMENT COLLAGE SLIDER
   ========================================================================== */
function initCollageSlider() {
  const track = document.getElementById('collage-track');
  const prevBtn = document.getElementById('collage-prev-btn');
  const nextBtn = document.getElementById('collage-next-btn');

  if (track && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -340, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: 340, behavior: 'smooth' });
    });
  }

  const cards = document.querySelectorAll('.equipment-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const machineName = card.getAttribute('data-equipment');
      if (machineName) {
        selectEquipmentChip(machineName);
        const quoteSection = document.getElementById('quote-section');
        if (quoteSection) {
          quoteSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

/* ==========================================================================
   4. SCROLL SHOWCASE (CHANGING MACHINERY & CATCHY ONE-LINERS)
   ========================================================================== */
function initScrollShowcase() {
  const slides = document.querySelectorAll('.equipment-slide');
  const dots = document.querySelectorAll('.slide-dot');

  if (slides.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-10% 0px -10% 0px',
    threshold: 0.4
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        slides.forEach(s => s.classList.remove('in-view', 'active'));
        entry.target.classList.add('in-view', 'active');

        const slideIndex = parseInt(entry.target.getAttribute('data-index') || '0', 10);
        dots.forEach((dot, idx) => {
          if (idx === slideIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  slides.forEach(slide => observer.observe(slide));

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIndex = parseInt(dot.getAttribute('data-target') || '0', 10);
      const targetSlide = document.getElementById(`slide-${targetIndex}`);
      if (targetSlide) {
        targetSlide.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const quickQuoteBtns = document.querySelectorAll('.quick-quote-trigger');
  quickQuoteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const machineName = btn.getAttribute('data-equipment');
      selectEquipmentChip(machineName);

      const quoteSection = document.getElementById('quote-section');
      if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ==========================================================================
   5. QUOTATION FORM, TICKET GENERATION, AND DISPATCH
   ========================================================================== */
let selectedEquipments = new Set(['JCB 3DX Backhoe']);

function selectEquipmentChip(machineName) {
  if (!machineName) return;

  const chips = document.querySelectorAll('.equipment-chip');
  chips.forEach(chip => {
    const val = chip.getAttribute('data-val');
    if (val === machineName) {
      chip.classList.add('selected');
      selectedEquipments.add(val);
    }
  });

  updateSelectedEquipmentsSummary();
}

function updateSelectedEquipmentsSummary() {
  const summaryEl = document.getElementById('selected-equipments-text');
  if (summaryEl) {
    if (selectedEquipments.size === 0) {
      summaryEl.textContent = 'None selected (Please choose at least one)';
      summaryEl.classList.add('text-red-500');
    } else {
      summaryEl.textContent = Array.from(selectedEquipments).join(', ');
      summaryEl.classList.remove('text-red-500');
    }
  }
}

function initQuotationForm() {
  const form = document.getElementById('quotation-form');
  const chips = document.querySelectorAll('.equipment-chip');
  const cityPills = document.querySelectorAll('.city-pill');
  const cityInput = document.getElementById('input-city');
  const modal = document.getElementById('success-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const whatsappConfirmBtn = document.getElementById('modal-whatsapp-btn');
  const downloadPdfBtn = document.getElementById('modal-download-pdf-btn');

  // Equipment Chip Click Handlers
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.getAttribute('data-val');
      if (chip.classList.contains('selected')) {
        if (selectedEquipments.size > 1) {
          chip.classList.remove('selected');
          selectedEquipments.delete(val);
        }
      } else {
        chip.classList.add('selected');
        selectedEquipments.add(val);
      }
      updateSelectedEquipmentsSummary();
    });
  });

  // City Fast-Select Pills
  cityPills.forEach(pill => {
    pill.addEventListener('click', () => {
      cityPills.forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      if (cityInput) {
        cityInput.value = pill.getAttribute('data-city') || '';
      }
    });
  });

  // Form Submit Handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submit-quote-btn');
      const submitText = document.getElementById('submit-btn-text');
      const submitSpinner = document.getElementById('submit-btn-spinner');

      const contractorName = document.getElementById('input-name').value.trim();
      const contractorPhone = document.getElementById('input-phone').value.trim();
      const contractorEmail = document.getElementById('input-email').value.trim();
      const projectCity = (cityInput ? cityInput.value.trim() : '') || 'Delhi NCR';
      const duration = document.getElementById('input-duration').value;
      const startDate = document.getElementById('input-date').value || 'Immediate Mobilization';
      const siteNotes = document.getElementById('input-notes').value.trim() || 'No special requirements noted';
      const equipmentList = Array.from(selectedEquipments).join(', ') || 'Heavy Construction Equipment';

      if (!contractorName || !contractorPhone) {
        alert('Please enter your Contractor / Company Name and Mobile Number.');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'GENERATING YOUR QUOTATION PASS...';
      if (submitSpinner) submitSpinner.classList.remove('hidden');

      // Generate Ticket ID and assign next queue number
      const randomTicketId = 'SR-TKT-' + Math.floor(100000 + Math.random() * 900000);
      const queueNumberToAssign = localQueueCounter;
      localQueueCounter += 1;
      localStorage.setItem('siterentals_queue_num', localQueueCounter.toString());

      const nowFormatted = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const quotePayload = {
        ticketId: randomTicketId,
        queueNumber: queueNumberToAssign,
        name: contractorName,
        phone: contractorPhone,
        email: contractorEmail || 'Not provided',
        equipment: equipmentList,
        location: projectCity,
        duration: duration,
        startDate: startDate,
        notes: siteNotes,
        timestamp: nowFormatted
      };

      currentTicket = quotePayload;

      // 1. Send to Backend API (/api/quote)
      let backendEmailSent = false;
      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotePayload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.ticket) {
            currentTicket = data.ticket;
          }
          if (data && data.emailDispatched) {
            backendEmailSent = true;
          }
        }
      } catch (err) {
        console.warn('API sync notice:', err);
      }

      // Restore UI State
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'GET FREE QUOTATION NOW ➔';
      if (submitSpinner) submitSpinner.classList.add('hidden');

      // Render the Complete Official Quotation Ticket in Modal
      renderTicketCard(currentTicket, backendEmailSent);

      // Setup WhatsApp button with pre-filled message (NO phone number in visible text)
      if (whatsappConfirmBtn) {
        const waMsg = encodeURIComponent(
          `Hello SiteRentals! I have quotation ticket ${currentTicket.ticketId} (Queue #${currentTicket.queueNumber}) for ${currentTicket.equipment} at ${currentTicket.location}. Please share the best rental quotation.`
        );
        whatsappConfirmBtn.href = `https://wa.me/917011775286?text=${waMsg}`;
      }

      // Show Modal
      if (modal) {
        modal.classList.add('active');
      }

      // Reset Form fields
      form.reset();
      updateSelectedEquipmentsSummary();
    });
  }

  // PDF Download Action Button
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadTicketAsPDF();
    });
  }

  // Close Modal Handler
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   6. RENDER OFFICIAL TICKET & DIRECT PDF VECTOR GENERATION (NEVER BLANK)
   ========================================================================== */
function renderTicketCard(ticket, isEmailed) {
  const container = document.getElementById('modal-ticket-container');
  if (!container || !ticket) return;

  // Build a direct mailto URL so customer can open a pre-filled ticket copy in 1 click
  const mailSubject = encodeURIComponent(`SiteRentals Quotation Pass #${ticket.queueNumber} (${ticket.ticketId})`);
  const mailBody = encodeURIComponent(
`OFFICIAL SITERENTALS QUOTATION PASS
==========================================
Queue Number: #${ticket.queueNumber}
Ticket ID: ${ticket.ticketId}
Issued: ${ticket.timestamp}

Contractor: ${ticket.name}
Phone: ${ticket.phone}
Equipment: ${ticket.equipment}
Site Location: ${ticket.location}
Duration: ${ticket.duration}
Mobilization Date: ${ticket.startDate}
Special Notes: ${ticket.notes}

==========================================
SiteRentals - Pan-India Heavy Equipment Network
Hotline / WhatsApp: Connect on site
`
  );

  const customerEmail = ticket.email && ticket.email.includes('@') ? ticket.email : '';
  const mailtoHref = `mailto:${customerEmail}?cc=tiwarigopal94@gmail.com&subject=${mailSubject}&body=${mailBody}`;

  const emailNotice = isEmailed
    ? `<div class="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
         <div class="flex items-center gap-2">
           <i data-lucide="mail-check" class="w-4 h-4 text-emerald-600 shrink-0"></i>
           <span>Verified pass emailed to <strong>${customerEmail}</strong>.</span>
         </div>
       </div>`
    : `<div class="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 flex items-center justify-between">
         <div class="flex items-center gap-2">
           <i data-lucide="mail" class="w-4 h-4 text-red-600 shrink-0"></i>
           <span>Quotation pass recorded for: <strong>${customerEmail || 'Contractor'}</strong></span>
         </div>
         <a href="${mailtoHref}" class="text-[10px] font-bold text-red-600 hover:text-red-700 underline uppercase tracking-wider">
           Open Email Draft ➔
         </a>
       </div>`;

  container.innerHTML = `
    <div id="printable-ticket-card" class="text-left font-sans bg-white">
      
      <!-- Ticket Header with SiteRentals Typography -->
      <div class="ticket-header-strip flex items-center justify-between">
        <div>
          <div class="text-xl font-black text-white tracking-wider">
            SITE<span class="text-red-500">RENTALS</span>
          </div>
          <p class="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">HEAVY EQUIPMENT MARKETPLACE</p>
        </div>
        <div class="text-right">
          <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
            Official Quotation Pass
          </span>
          <p class="text-[10px] text-slate-300 font-mono mt-0.5">PAN-INDIA FLEET</p>
        </div>
      </div>

      <!-- Queue Number Highlight Box -->
      <div class="ticket-queue-badge flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-red-600 block">YOUR LIVE POSITION IN QUEUE</span>
          <div class="flex items-baseline space-x-2 mt-0.5">
            <span class="text-4xl font-black text-red-700 tracking-tight">#${ticket.queueNumber}</span>
            <span class="text-xs font-bold text-slate-600">Priority Dispatch Active</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[11px] font-mono text-slate-500">Ticket ID:</div>
          <div class="text-sm font-black text-slate-900 font-mono">${ticket.ticketId}</div>
          <span class="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
            🟢 IN QUEUE
          </span>
        </div>
      </div>

      <!-- Ticket Filled Details Grid -->
      <div class="p-5 space-y-3 text-xs border-b border-slate-200 bg-white">
        
        <div class="grid grid-cols-2 gap-4 pb-2 border-b border-slate-100">
          <div>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Contractor / Company</span>
            <span class="font-bold text-slate-900 text-sm">${ticket.name}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Contact Phone</span>
            <span class="font-bold text-slate-900 text-sm">${ticket.phone}</span>
          </div>
        </div>

        <div class="pb-2 border-b border-slate-100">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Equipment Requested</span>
          <div class="inline-block px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 font-extrabold rounded-lg text-xs">
            🚜 ${ticket.equipment}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
          <div>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Project Site</span>
            <span class="font-bold text-slate-800">${ticket.location}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Duration</span>
            <span class="font-bold text-slate-800">${ticket.duration}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Mobilization</span>
            <span class="font-bold text-slate-800">${ticket.startDate}</span>
          </div>
        </div>

        ${ticket.notes && ticket.notes !== 'No special requirements noted' ? `
          <div class="pt-1">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Special Site Notes</span>
            <p class="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">${ticket.notes}</p>
          </div>
        ` : ''}

        ${emailNotice}
      </div>

      <!-- Ticket Security Barcode Footer -->
      <div class="bg-slate-900 text-white p-3.5 flex items-center justify-between text-[10px]">
        <div>
          <span class="font-mono text-slate-400 block text-[9px]">VERIFICATION BARCODE</span>
          <span class="font-mono text-xs tracking-widest text-red-400 font-bold">||||| ||| ||||||| |||| |||||| |||||</span>
        </div>
        <div class="text-right text-slate-400">
          <div>Issued: ${ticket.timestamp}</div>
          <div class="text-white font-semibold">SiteRentals Technologies Pvt. Ltd.</div>
        </div>
      </div>

    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Robust Vector PDF Generation using jsPDF
 * Completely immune to canvas scrolling/transform issues - guaranteed never blank.
 */
function downloadTicketAsPDF() {
  if (!currentTicket) {
    alert('Please submit your quotation requirement first.');
    return;
  }

  try {
    const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFClass) {
      window.print();
      return;
    }

    const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Navy Header Banner (#0F172A)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 38, 'F');

    // 2. Red Accent Strip (#DC2626)
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 38, pageWidth, 2.5, 'F');

    // 3. Brand Typography
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('SITE', 18, 20);

    doc.setTextColor(239, 68, 68);
    doc.text('RENTALS', 40, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text('HEAVY EQUIPMENT MARKETPLACE • PAN INDIA', 18, 28);

    // 4. Pass Badge in Header
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(pageWidth - 68, 13, 50, 12, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL QUOTATION PASS', pageWidth - 64, 20.5);

    // 5. Queue Position Box
    doc.setFillColor(254, 242, 242); // #FEF2F2
    doc.setDrawColor(254, 202, 202); // #FECACA
    doc.roundedRect(18, 48, pageWidth - 36, 32, 4, 4, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('YOUR LIVE POSITION IN QUEUE', 25, 57);

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(153, 27, 27);
    doc.text(`#${currentTicket.queueNumber}`, 25, 73);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Priority Dispatch Active | Est. Response: ~12 Mins', 55, 71);

    // Ticket ID & Status
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Ticket ID:', pageWidth - 80, 57);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(currentTicket.ticketId, pageWidth - 80, 64);

    doc.setFontSize(8.5);
    doc.setTextColor(22, 163, 74);
    doc.text('STATUS: IN QUEUE', pageWidth - 80, 72);

    // 6. Details Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('REQUIREMENT SUMMARY', 18, 92);
    doc.setDrawColor(226, 232, 240);
    doc.line(18, 94, pageWidth - 18, 94);

    const rows = [
      ['Contractor / Company:', currentTicket.name || 'Valued Contractor'],
      ['Contact Mobile Number:', currentTicket.phone || 'Not provided'],
      ['Customer Email:', currentTicket.email || 'Not provided'],
      ['Equipment Requested:', currentTicket.equipment || 'Heavy Equipment'],
      ['Project Site Location:', currentTicket.location || 'India'],
      ['Rental Duration:', currentTicket.duration || 'Flexible'],
      ['Required Mobilization:', currentTicket.startDate || 'Immediate'],
      ['Special Project Notes:', currentTicket.notes || 'No special requirements noted']
    ];

    let startY = 104;
    rows.forEach(([label, value], idx) => {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, startY);

      doc.setFont('helvetica', idx === 3 ? 'bold' : 'normal');
      doc.setTextColor(idx === 3 ? 220 : 15, idx === 3 ? 38 : 23, idx === 3 ? 38 : 42);

      const splitVal = doc.splitTextToSize(String(value), pageWidth - 95);
      doc.text(splitVal, 82, startY);

      startY += Math.max(10, splitVal.length * 6);
      if (idx < rows.length - 1) {
        doc.setDrawColor(241, 245, 249);
        doc.line(20, startY - 3, pageWidth - 20, startY - 3);
      }
    });

    // 7. Security Barcode Footer
    const footerY = 246;
    doc.setFillColor(15, 23, 42);
    doc.rect(0, footerY, pageWidth, 51, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('SiteRentals Technologies Pvt. Ltd.', 18, footerY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Pan-India Verified Heavy Construction Machinery Network • ISO 9001:2015 Registered', 18, footerY + 18);
    doc.text('To check live status or speed up dispatch, quote this Ticket ID on WhatsApp.', 18, footerY + 24);

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68);
    doc.text('||||| ||| ||||||| |||| |||||| ||||| ||||||', pageWidth - 92, footerY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('SECURE DISPATCH PASS', pageWidth - 92, footerY + 22);

    // Save PDF
    const filename = `SiteRentals-Pass-${currentTicket.queueNumber}-${currentTicket.ticketId}.pdf`;
    doc.save(filename);

  } catch (err) {
    console.error('PDF Generation Error:', err);
    window.print();
  }
}

/* ==========================================================================
   7. LIVE COUNTERS
   ========================================================================== */
function initCounters() {
  const machineCounter = document.getElementById('live-machine-count');
  if (machineCounter) {
    let count = 2840;
    setInterval(() => {
      const change = Math.floor(Math.random() * 3) - 1;
      count = Math.max(2810, Math.min(2890, count + change));
      machineCounter.textContent = count.toLocaleString('en-IN');
    }, 4500);
  }
}
