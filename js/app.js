(function () {
	const IMAGES_DIR = 'img/Catholic Designs/';
	const TOTAL_IMAGES = 365; // fallback count
	const PER_PAGE = 30;

	function generateFallbackNames() { const names = []; for (let i = 1; i <= TOTAL_IMAGES; i++) names.push(`CD ${i} copy.jpg`); return names; }

	const sourceNames = (window.CD_MANIFEST && Array.isArray(window.CD_MANIFEST) && window.CD_MANIFEST.length)
		? window.CD_MANIFEST
		: generateFallbackNames();

	function normalize(str) {
		return (str || '')
			.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	// Optional static metadata
	const metaArray = Array.isArray(window.CD_META) ? window.CD_META : [];
	const fileToMeta = new Map(metaArray.map(m => [String(m.file || '').toLowerCase(), normalize(m.keywords || '')]));

	const imagesBase = sourceNames.map((name, idx) => {
		const raw = name.replace(/copy/i, '').replace(/\.jpg$/i, '');
		const base = normalize(raw);
		const extra = fileToMeta.get(name.toLowerCase()) || '';
		return { id: idx, file: name, src: IMAGES_DIR + name, alt: '', text: (base + ' ' + extra).trim() };
	});

	const galleryEl = document.getElementById('gallery');
	const searchInput = document.getElementById('search');
	const searchClear = document.getElementById('searchClear');
	const prevBtn = document.getElementById('prev');
	const nextBtn = document.getElementById('next');
	const pageIndicator = document.getElementById('pageIndicator');
	const pageNumbers = document.getElementById('pageNumbers');
	const paginationBar = document.querySelector('nav.pagination');
	const loadingEl = document.getElementById('loading');

	const lightboxEl = document.getElementById('lightbox');
	const lightboxImg = document.getElementById('lightboxImg');
	const lightboxCaption = document.getElementById('lightboxCaption');
	const lbClose = document.getElementById('lbClose');
	const lbPrev = document.getElementById('lbPrev');
	const lbNext = document.getElementById('lbNext');

	let filtered = imagesBase.slice();
	let currentPage = 1; let currentIndexInFiltered = 0;

	function showLoading() { if (loadingEl) loadingEl.classList.add('show'); }
	function hideLoading() { if (loadingEl) loadingEl.classList.remove('show'); }
	function withLoading(run) { showLoading(); requestAnimationFrame(() => { run(); setTimeout(hideLoading, 220); }); }

	function paginate(list, page, perPage) { const totalPages = Math.max(1, Math.ceil(list.length / perPage)); const clampedPage = Math.min(Math.max(1, page), totalPages); const start = (clampedPage - 1) * perPage; return { items: list.slice(start, start + perPage), page: clampedPage, totalPages, start, end: Math.min(start + perPage, list.length) }; }

	function renderPageNumbers(totalPages) {
		pageNumbers.innerHTML = '';
		const maxButtons = 7; let start = Math.max(1, currentPage - 3); let end = Math.min(totalPages, start + maxButtons - 1); if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
		for (let p = start; p <= end; p++) { const btn = document.createElement('button'); btn.className = 'page-number' + (p === currentPage ? ' active' : ''); btn.textContent = String(p); btn.addEventListener('click', () => { withLoading(() => { currentPage = p; renderGallery(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }); pageNumbers.appendChild(btn); }
	}

	function renderNoResults() {
		const gallery2El = document.getElementById('gallery2');
		if (!gallery2El) return;
	
		gallery2El.innerHTML = `
			<div class="gallerynodata">
				<div><img src="./img/nodata.webp" alt="No results found" /></div>
			</div>`;
	}
	

	function renderGallery() {
		if (filtered.length === 0) {
			paginationBar.style.display = 'none';
			document.getElementById('gallery').innerHTML = ''; // clear main gallery
			renderNoResults(); // show message in #gallery2
			return;
		}
	
		// otherwise show results in gallery and clear gallery2
		document.getElementById('gallery2').innerHTML = '';
		paginationBar.style.display = '';
		const { items, page, totalPages, start, end } = paginate(filtered, currentPage, PER_PAGE);
	
		galleryEl.innerHTML = '';
		items.forEach((item, i) => {
			const card = document.createElement('div');
			card.className = 'card fade-in';
			card.setAttribute('data-index', ((page - 1) * PER_PAGE) + i);
	
			const img = document.createElement('img');
			img.loading = "lazy";
			img.src = item.src;
			img.alt = "Gallery Image";
	
			img.onerror = () => {
				card.remove();
			};
	
			card.appendChild(img);
	
			card.addEventListener('click', () => 
				openLightbox(((page - 1) * PER_PAGE) + i)
			);
	
			galleryEl.appendChild(card);
		});
	
		prevBtn.disabled = page <= 1;
		nextBtn.disabled = page >= totalPages;
		renderPageNumbers(totalPages);
		pageIndicator.textContent = `Page ${page} · Showing ${start + 1} to ${end} of ${filtered.length}`;
	}
	

	function applySearch(q) {
		const qn = normalize(q);
		if (!qn) { filtered = imagesBase.slice(); currentPage = 1; renderGallery(); return; }
		const terms = qn.split(' ').filter(Boolean);
		filtered = imagesBase.filter(img => terms.every(t => img.text.includes(t)));
		currentPage = 1; renderGallery();
	}

	function debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); }; }
	const applySearchDebounced = debounce((val) => withLoading(() => applySearch(val)), 180);

	function openLightbox(filteredIndex) { currentIndexInFiltered = filteredIndex; const item = filtered[currentIndexInFiltered]; if (!item) return; lightboxImg.src = item.src; lightboxImg.alt = ''; lightboxCaption.textContent = ''; lightboxEl.classList.add('open'); }
	function closeLightbox() { lightboxEl.classList.remove('open'); }
	function lightboxNext() { if (currentIndexInFiltered < filtered.length - 1) { currentIndexInFiltered++; openLightbox(currentIndexInFiltered); } }
	function lightboxPrev() { if (currentIndexInFiltered > 0) { currentIndexInFiltered--; openLightbox(currentIndexInFiltered); } }

	searchInput.addEventListener('input', (e) => applySearchDebounced(e.target.value));
	if (searchClear) searchClear.addEventListener('click', () => { searchInput.value = ''; withLoading(() => applySearch('')); searchInput.focus(); });
	prevBtn.addEventListener('click', () => { withLoading(() => { currentPage = Math.max(1, currentPage - 1); renderGallery(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
	nextBtn.addEventListener('click', () => { withLoading(() => { const totalPages = Math.ceil(filtered.length / PER_PAGE); currentPage = Math.min(totalPages, currentPage + 1); renderGallery(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });

	lbClose.addEventListener('click', closeLightbox);
	lbPrev.addEventListener('click', lightboxPrev);
	lbNext.addEventListener('click', lightboxNext);
	lightboxEl.addEventListener('click', (e) => { if (e.target === lightboxEl) closeLightbox(); });
	window.addEventListener('keydown', (e) => { if (!lightboxEl.classList.contains('open')) return; if (e.key === 'Escape') closeLightbox(); if (e.key === 'ArrowRight') lightboxNext(); if (e.key === 'ArrowLeft') lightboxPrev(); });

	// OCR indexing (silent, cached) with explicit worker
	const OCR_CACHE_KEY = 'cd_ocr_v2';
	let ocrCache = {}; try { ocrCache = JSON.parse(localStorage.getItem(OCR_CACHE_KEY) || '{}'); } catch { }
	let ocrWorker = null; let ocrReady = false;

	async function ensureWorker() {
		if (ocrReady || !window.Tesseract) return;
		ocrWorker = await Tesseract.createWorker({
			logger: null,
			workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
			corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/dist/tesseract-core.wasm.js',
			langPath: 'https://tessdata.projectnaptha.com/4.0.0'
		});
		await ocrWorker.loadLanguage('eng');
		await ocrWorker.initialize('eng');
		ocrReady = true;
	}

	function downscale(src) {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				const maxW = 1200, maxH = 1200;
				let { width: w, height: h } = img;
				const ratio = Math.min(1, maxW / w, maxH / h);
				const cw = Math.max(1, Math.round(w * ratio));
				const ch = Math.max(1, Math.round(h * ratio));
				const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
				const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, cw, ch);
				resolve(canvas.toDataURL('image/jpeg', 0.8));
			};
			img.src = src;
		});
	}

	async function ocrImage(file, src) {
		try {
			await ensureWorker(); if (!ocrReady) return '';
			const dataUrl = await downscale(src);
			const { data } = await ocrWorker.recognize(dataUrl);
			return normalize(data.text);
		} catch { return ''; }
	}

	async function buildOcrIndex() {
		if (!window.Tesseract) return;
		let processed = 0;
		for (const img of imagesBase) {
			if (ocrCache[img.file]) { img.text = (img.text + ' ' + ocrCache[img.file]).trim(); processed++; continue; }
			const text = await ocrImage(img.file, img.src);
			ocrCache[img.file] = text; img.text = (img.text + ' ' + text).trim(); processed++;
			if (processed % 10 === 0) localStorage.setItem(OCR_CACHE_KEY, JSON.stringify(ocrCache));
		}
		localStorage.setItem(OCR_CACHE_KEY, JSON.stringify(ocrCache));
		try { if (ocrWorker) { await ocrWorker.terminate(); ocrReady = false; } } catch { }
	}

	buildOcrIndex();

	renderGallery();
})();

const searchInput = document.getElementById('search');
const searchClear = document.getElementById('searchClear');

// Show/hide clear button based on input content
searchInput.addEventListener('input', function () {
	if (this.value.length > 0) {
		searchClear.classList.add('visible');
	} else {
		searchClear.classList.remove('visible');
	}
});

// Clear search functionality
searchClear.addEventListener('click', function () {
	searchInput.value = '';
	searchClear.classList.remove('visible');
	searchInput.focus();
});

// Focus search with keyboard shortcut
document.addEventListener('keydown', function (e) {
	if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
		e.preventDefault();
		searchInput.focus();
	}
});



// Example of how to use different variants
function renderNoResults(variant = 1) {
	const illustrations = {
		1: `<svg class="illustration" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<!-- Empty folder -->
			<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="#64748b" stroke-width="2" fill="rgba(100, 116, 139, 0.1)"/>
			<circle cx="9" cy="13" r="1" fill="#94a3b8"/>
			<circle cx="12" cy="13" r="1" fill="#94a3b8"/>
			<circle cx="15" cy="13" r="1" fill="#94a3b8"/>
			<circle cx="16" cy="8" r="3" stroke="#38bdf8" stroke-width="1.5"/>
			<path d="M18.5 10.5l1.5 1.5" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
		</svg>`,
		2: `<svg class="illustration" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<!-- Empty database -->
			<ellipse cx="12" cy="5" rx="9" ry="3" stroke="#a855f7" stroke-width="2" fill="rgba(168, 85, 247, 0.1)"/>
			<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="#a855f7" stroke-width="2"/>
			<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke="#a855f7" stroke-width="2"/>
			<path d="M12 12v3" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
			<circle cx="10" cy="13" r="1" fill="#c4b5fd"/>
			<circle cx="14" cy="13" r="1" fill="#c4b5fd"/>
		</svg>`,
		3: `<svg class="illustration" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<!-- Empty document stack -->
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#22c55e" stroke-width="2" fill="rgba(34, 197, 94, 0.1)"/>
			<polyline points="14,2 14,8 20,8" stroke="#22c55e" stroke-width="2"/>
			<line x1="16" y1="13" x2="8" y2="13" stroke="#86efac" stroke-width="2" opacity="0.5"/>
			<line x1="16" y1="17" x2="8" y2="17" stroke="#86efac" stroke-width="2" opacity="0.3"/>
			<circle cx="12" cy="15" r="1" fill="#86efac"/>
		</svg>`,
		4: `<svg class="illustration" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<!-- Empty grid/gallery -->
			<rect x="3" y="3" width="7" height="7" rx="2" stroke="#f59e0b" stroke-width="2" fill="rgba(245, 158, 11, 0.1)"/>
			<rect x="14" y="3" width="7" height="7" rx="2" stroke="#f59e0b" stroke-width="2" fill="rgba(245, 158, 11, 0.1)"/>
			<rect x="3" y="14" width="7" height="7" rx="2" stroke="#f59e0b" stroke-width="2" fill="rgba(245, 158, 11, 0.1)"/>
			<rect x="14" y="14" width="7" height="7" rx="2" stroke="#f59e0b" stroke-width="2" fill="rgba(245, 158, 11, 0.1)"/>
			<circle cx="6.5" cy="6.5" r="1" fill="#fbbf24" opacity="0.5"/>
			<circle cx="17.5" cy="6.5" r="1" fill="#fbbf24" opacity="0.5"/>
			<circle cx="6.5" cy="17.5" r="1" fill="#fbbf24" opacity="0.5"/>
			<circle cx="17.5" cy="17.5" r="1" fill="#fbbf24" opacity="0.5"/>
		</svg>`
	};

	const messages = {
		1: {
			title: "No results found",
			subtitle: "We couldn't find any designs matching your search. Try adjusting your filters or search terms."
		},
		2: {
			title: "Nothing here yet",
			subtitle: "Your search didn't return any results. Try different keywords or browse our popular collections."
		},
		3: {
			title: "All caught up!",
			subtitle: "You've viewed all available designs. Check back later for new uploads."
		}
	};

	const variantClass = variant > 1 ? ` variant-${variant}` : '';
	const illustration = illustrations[variant] || illustrations[1];
	const message = messages[variant] || messages[1];

	return `
		<div class="no-results${variantClass}">
			${illustration}
			<h2>${message.title}</h2>
			<p>${message.subtitle}</p>
			<div class="suggestions">
				<a href="#" class="suggestion-tag">Popular designs</a>
				<a href="#" class="suggestion-tag">Recent uploads</a>
				<a href="#" class="suggestion-tag">Browse all</a>
			</div>
			<button class="retry-button" onclick="window.location.reload()">
				Try again
			</button>
		</div>
	`;
}

// Example usage:
// document.getElementById('gallery').innerHTML = renderNoResults(1);