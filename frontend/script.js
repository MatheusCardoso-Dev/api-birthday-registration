(() => {
    // Config
    const eventMeta = document.querySelector('meta[name="evento-data"]');
    let eventDateISO = eventMeta?.getAttribute('content') || '2026-08-15T20:00';
    const eventDate = new Date(eventDateISO);


    // UI elements
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const eventDateText = document.getElementById('event-date-text');
    const modalDetails = document.getElementById('modal-details');
    const modalRsvp = document.getElementById('modal-rsvp');
    const openDetails = document.getElementById('open-details');
    const openRsvp = document.getElementById('open-rsvp');
    const openRsvp2 = document.getElementById('open-rsvp-2');
    const guestListEl = document.getElementById('guest-list');
    const guestCountEl = document.getElementById('guest-count');
    const rsvpForm = document.getElementById('rsvp-form');
    const eventDateModal = document.getElementById('modal-event-date');
    const confettiCanvas = document.getElementById('confetti-canvas');

    const LS_KEY = 'matheus18_rsvp';

    // Format event date
    function fmtDate(d) {
        return d.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
    }
    eventDateText.textContent = fmtDate(eventDate);
    eventDateModal.textContent = fmtDate(eventDate);

    // Countdown
    function updateCountdown() {
        const now = new Date();
        let diff = Math.max(0, eventDate - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const minutes = Math.floor(diff / (1000 * 60));
        diff -= minutes * (1000 * 60);
        const seconds = Math.floor(diff / 1000);
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Modal controls
   function openModal(modal) {
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}


    // Open buttons
    openDetails.addEventListener('click', () => openModal(modalDetails));
    openRsvp.addEventListener('click', () => openModal(modalRsvp));
    if (openRsvp2) {
        openRsvp2.addEventListener('click', () => {
            closeModal(modalDetails);
            openModal(modalRsvp);
        });
    }

    // Close buttons
    document.querySelectorAll('.modal-overlay [data-close], .modal-overlay .modal-close').forEach(btn => {
        btn.addEventListener('click', e => {
            const modal = e.target.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });

    // Close clicking outside modal-content
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Escape key closes open modals
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay[aria-hidden="false"]').forEach(m => closeModal(m));
        }
    });

    // RSVP storage
    function getGuests() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function saveGuests(list) {
        localStorage.setItem(LS_KEY, JSON.stringify(list));
    }

    function refreshGuestList() {
        const list = getGuests();
        guestListEl.innerHTML = '';
        if (list.length === 0) {
            guestCountEl.textContent = 'Nenhum confirmado ainda.';
            return;
        }
        list.forEach((g, idx) => {
            const li = document.createElement('li');
            const info = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = g.name;
            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.textContent = `${g.guests} acompanhantes • ${new Date(g.time).toLocaleString()}`;
            info.append(name, meta);

            const actions = document.createElement('div');
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove';
            removeBtn.textContent = 'Remover';
            removeBtn.addEventListener('click', () => {
                const updated = getGuests().filter((_, i) => i !== idx);
                saveGuests(updated);
                refreshGuestList();
            });
            actions.appendChild(removeBtn);
            li.append(info, actions);
            guestListEl.appendChild(li);
        });
        const total = list.reduce((s, x) => s + Number(x.guests) + 1, 0);
        guestCountEl.textContent = `${list.length} confirmação(ões) — ${total} convidado(s) no total`;
    }

    // RSVP form
    rsvpForm.addEventListener('submit', async e => {
        e.preventDefault();
        const form = new FormData(rsvpForm);
        const name = String(form.get('name') || '').trim();
        const guests = Number(form.get('guests') || 0);
        const message = String(form.get('message') || '').trim();

        if (!name) {
            alert('Informe seu nome.');
            return;
        }

        // Backend fetch
        try {
            const response = await fetch('http://localhost:3000/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: name, quantidade: guests, mensagem: message })
            });

            const result = await response.json();

            if (!response.ok) {
                alert('Erro ao enviar confirmação: ' + (result.erro || 'Erro desconhecido'));
                return;
            }

            const entry = { name, guests, message, time: new Date().toISOString() };
            const list = getGuests();
            list.unshift(entry);
            saveGuests(list);
            refreshGuestList();

            closeModal(modalRsvp);
            rsvpForm.reset();

            flashSuccess(`${name}, confirmação enviada!`);
            fireConfetti();

        } catch (err) {
            console.error(err);
            alert('Falha ao conectar ao servidor.');
        }
    });

    // Success badge
    function flashSuccess(msg) {
        const el = document.createElement('div');
        el.className = 'success-badge';
        el.style.position = 'fixed';
        el.style.top = '18px';
        el.style.left = '50%';
        el.style.transform = 'translateX(-50%)';
        el.style.zIndex = 80;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }

    // Confetti
    function fireConfetti() {
        const ctx = confettiCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        confettiCanvas.width = window.innerWidth * dpr;
        confettiCanvas.height = window.innerHeight * dpr;
        confettiCanvas.style.width = `${window.innerWidth}px`;
        confettiCanvas.style.height = `${window.innerHeight}px`;
        ctx.scale(dpr, dpr);

        const colors = ['#d4af37', '#f3d77c', '#081a33', '#2b63b6', '#efe9de'];
        const pieces = [];
        for (let i = 0; i < 110; i++) {
            pieces.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * -200,
                w: 6 + Math.random() * 10,
                h: 8 + Math.random() * 14,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                velocityX: -2 + Math.random() * 4,
                velocityY: 1 + Math.random() * 6,
                gravity: 0.05 + Math.random() * 0.15,
                tilt: Math.random() * 10
            });
        }
        let duration = 2500;
        let last = performance.now();

        function frame(now) {
            const delta = now - last;
            last = now;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            for (let p of pieces) {
                p.x += p.velocityX;
                p.y += p.velocityY;
                p.velocityY += p.gravity;
                p.rotation += 4;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            }
            duration -= delta;
            if (duration > 0) {
                requestAnimationFrame(frame);
            } else {
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            }
        }
        requestAnimationFrame(frame);
    }

    // Init
    refreshGuestList();

    // Resize confetti canvas
    window.addEventListener('resize', () => {
        const dpr = window.devicePixelRatio || 1;
        confettiCanvas.width = window.innerWidth * dpr;
        confettiCanvas.height = window.innerHeight * dpr;
        confettiCanvas.style.width = `${window.innerWidth}px`;
        confettiCanvas.style.height = `${window.innerHeight}px`;
    });

})();
