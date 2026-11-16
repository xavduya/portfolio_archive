(() => {
    document.querySelectorAll('[data-scratch]').forEach(setup);

    function setup(root) {
        const canvas = root.querySelector('.scratch__cover');
        const reveal = root.querySelector('.scratch__reveal');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const cover = new Image();
        const dpr = window.devicePixelRatio || 1;

        // Pick a random reveal image from the pool, so each page load is a
        // surprise. Falls back to whatever src is already on the <img> (if any)
        // when no pool is given.
        const pool = (root.dataset.revealPool || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (pool.length && reveal) {
            reveal.src = pool[Math.floor(Math.random() * pool.length)];
        }

        let drawing = false;
        let last = null;
        let initialOpaque = 0;
        let ready = false;

        function sizeCanvas() {
            const rect = root.getBoundingClientRect();
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
        }

        function drawCover() {
            const scale = Math.max(canvas.width / cover.naturalWidth, canvas.height / cover.naturalHeight);
            const w = cover.naturalWidth * scale;
            const h = cover.naturalHeight * scale;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(cover, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        }

        cover.onload = () => {
            sizeCanvas();
            drawCover();
            initialOpaque = countOpaque();
            ready = true;
        };
        cover.src = root.dataset.scratch;

        window.addEventListener('resize', () => {
            if (!ready || canvas.classList.contains('is-done')) return;
            sizeCanvas();
            drawCover();
            initialOpaque = countOpaque();
        });

        const brushSize = () => Math.max(14, canvas.width * 0.08);

        function toCanvasPoint(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (canvas.width / rect.width),
                y: (e.clientY - rect.top) * (canvas.height / rect.height),
            };
        }

        function scratch(a, b) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = brushSize();
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }

        function countOpaque() {
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let opaque = 0;
            for (let i = 3; i < data.length; i += 16) {
                if (data[i] > 128) opaque++;
            }
            return opaque * 4;
        }

        function checkReveal() {
            if (!initialOpaque) return;
            if (countOpaque() / initialOpaque < 0.15) {
                canvas.classList.add('is-done');
            }
        }

        canvas.addEventListener('pointerdown', (e) => {
            if (!ready) return;
            drawing = true;
            canvas.setPointerCapture(e.pointerId);
            last = toCanvasPoint(e);
            scratch(last, last);
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!drawing) return;
            const p = toCanvasPoint(e);
            scratch(last, p);
            last = p;
        });

        const endStroke = () => {
            if (!drawing) return;
            drawing = false;
            checkReveal();
        };
        canvas.addEventListener('pointerup', endStroke);
        canvas.addEventListener('pointercancel', endStroke);
    }
})();