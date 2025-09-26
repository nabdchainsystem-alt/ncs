(() => {
  'use strict';

  const API_BASE = '/api/inventory';
  const INITIAL_LIMIT = 50;
  const PAGE_LIMIT = 20;

  const STATUS_LABELS = Object.freeze({
    in_stock: 'In stock',
    low: 'Low stock',
    out_of_stock: 'Out of stock',
    discontinued: 'Discontinued'
  });

  const state = {
    items: [],
    cards: [],
    cursor: null,
    loading: false,
    done: false
  };

  const filterForm = document.getElementById('filter-form');
  const searchInput = document.getElementById('search');
  const statusSelect = document.getElementById('status');
  const minQtyInput = document.getElementById('minQty');
  const grid = document.getElementById('inventory-grid');
  const resultsCount = document.getElementById('results-count');
  const loadMoreBtn = document.getElementById('load-more');
  const toast = document.getElementById('toast');
  const srStatus = document.getElementById('sr-status');

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let tiltEnabled = !reduceMotionQuery.matches;

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleMotionPreference);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleMotionPreference);
  }

  const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  let toastTimer = null;

  function init() {
    filterForm.addEventListener('submit', onSubmit);
    filterForm.addEventListener('reset', onReset);
    statusSelect.addEventListener('change', () => fetchInventory({ reset: true }));
    minQtyInput.addEventListener('change', () => fetchInventory({ reset: true }));

    loadMoreBtn.addEventListener('click', () => fetchInventory({ reset: false }));
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        fetchInventory({ reset: true });
      }
    });

    fetchInventory({ reset: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function onSubmit(event) {
    event.preventDefault();
    fetchInventory({ reset: true });
  }

  function onReset(event) {
    event.preventDefault();
    searchInput.value = '';
    statusSelect.value = '';
    minQtyInput.value = '';
    requestAnimationFrame(() => fetchInventory({ reset: true }));
  }

  function handleMotionPreference(event) {
    tiltEnabled = !event.matches;
    if (!tiltEnabled) {
      detachAllTilt();
    } else {
      reattachTilt();
    }
  }

  function fetchInventory({ reset }) {
    if (state.loading) {
      return;
    }
    if (!reset && state.done) {
      return;
    }

    state.loading = true;
    const isInitialLoad = reset;
    const limit = isInitialLoad ? INITIAL_LIMIT : PAGE_LIMIT;

    if (isInitialLoad) {
      detachAllTilt();
      state.items = [];
      state.cards = [];
      state.cursor = null;
      state.done = false;
      renderSkeletons(6);
    } else {
      setLoadMoreState(true);
    }

    const params = new URLSearchParams();
    const qValue = searchInput.value.trim().slice(0, 120);
    if (qValue) {
      params.set('q', qValue);
    }

    const statusValue = statusSelect.value;
    if (statusValue) {
      params.set('status', statusValue);
    }

    const minQtyValue = Number.parseInt(minQtyInput.value, 10);
    if (!Number.isNaN(minQtyValue) && minQtyValue >= 0) {
      params.set('minQty', minQtyValue);
    }

    params.set('limit', limit);
    if (!isInitialLoad && state.cursor) {
      params.set('cursor', state.cursor);
    }

    grid.setAttribute('aria-busy', 'true');

    fetch(`${API_BASE}?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) {
          const err = new Error(`Request failed with status ${response.status}`);
          err.status = response.status;
          throw err;
        }
        return response.json();
      })
      .then((payload) => {
        const items = Array.isArray(payload.items) ? payload.items : [];

        if (isInitialLoad) {
          clearGrid();
        }

        renderItems(items, { append: !isInitialLoad });

        state.cursor = payload.nextCursor || null;
        state.done = !payload.nextCursor;

        updateResultsCounter();
        srStatus.textContent = state.items.length
          ? `${state.items.length} item${state.items.length === 1 ? '' : 's'} loaded`
          : 'No inventory items match your filters.';

        if (!state.items.length) {
          renderEmptyState('No inventory items match your filters yet.');
        }

        loadMoreBtn.hidden = state.done || !state.items.length;
        loadMoreBtn.setAttribute('aria-hidden', loadMoreBtn.hidden ? 'true' : 'false');
      })
      .catch((error) => {
        console.error(error);
        showToast('Unable to load inventory. Please retry in a moment.', true);
        if (isInitialLoad) {
          renderErrorState('We couldn’t reach the inventory feed.');
        }
      })
      .finally(() => {
        state.loading = false;
        grid.setAttribute('aria-busy', 'false');
        if (!reset) {
          setLoadMoreState(false);
        } else {
          clearSkeletons();
        }
      });
  }

  function renderItems(items, { append }) {
    if (!append) {
      state.cards = [];
    }

    if (!append && !items.length) {
      return;
    }

    if (!append) {
      clearGrid();
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      if (state.items.some((existing) => Number(existing.id) === Number(item.id))) {
        return;
      }

      state.items.push(item);

      const card = createCard(item);
      fragment.appendChild(card);
      state.cards.push(card);

      if (tiltEnabled && window.HoloTilt) {
        window.HoloTilt.attach(card);
      } else {
        card.setAttribute('data-tilt', 'false');
      }
    });

    grid.appendChild(fragment);
  }

  function createCard(item) {
    const safeName = escapeHtml(item.name ?? 'Untitled');
    const safeSku = escapeHtml(item.sku ?? 'Unknown');
    const quantity = Number.isFinite(item.quantity) ? item.quantity : Number.parseInt(item.quantity, 10) || 0;
    const priceValue =
      typeof item.price === 'number' && Number.isFinite(item.price)
        ? item.price
        : Number.parseFloat(item.price) || 0;
    const priceText = currencyFormatter.format(priceValue);
    const statusLabel = STATUS_LABELS[item.status] || 'Unknown';

    const descriptionText = item.description ? String(item.description).trim() : '';
    const description = escapeHtml(truncate(descriptionText || 'No description available.', 200));
    const updatedText = relativeTimeFromNow(item.updatedAt);

    const mediaMarkup = buildMediaMarkup(item);
    const badgeClass = `status-badge status-badge--${item.status}`;

    const card = document.createElement('article');
    card.className = 'inventory-card';
    card.dataset.status = item.status || 'unknown';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');

    card.innerHTML = `
      <div class="inventory-card__media">
        ${mediaMarkup}
      </div>
      <div class="inventory-card__body">
        <header class="inventory-card__header">
          <h2 class="inventory-card__title">${safeName}</h2>
          <span class="${badgeClass}">${escapeHtml(statusLabel)}</span>
        </header>
        <p class="inventory-card__sku"><span>SKU</span><span>${safeSku}</span></p>
        <p class="inventory-card__description">${description}</p>
        <dl class="inventory-card__meta">
          <div class="inventory-card__meta-item">
            <dt>Quantity</dt>
            <dd>${quantity}</dd>
          </div>
          <div class="inventory-card__meta-item">
            <dt>Price</dt>
            <dd>${escapeHtml(priceText)}</dd>
          </div>
          <div class="inventory-card__meta-item inventory-card__meta-item--status">
            <dt>Status</dt>
            <dd>${escapeHtml(statusLabel)}</dd>
          </div>
          <div class="inventory-card__meta-item inventory-card__meta-item--span">
            <dt>Updated</dt>
            <dd>${escapeHtml(updatedText)}</dd>
          </div>
        </dl>
      </div>
    `;

    card.setAttribute('data-tilt', tiltEnabled ? 'true' : 'false');

    return card;
  }

  function buildMediaMarkup(item) {
    const imageUrl = sanitizeUrl(item.imageUrl);
    if (imageUrl) {
      return `<img src="${imageUrl}" alt="${escapeHtml(item.name ?? 'Inventory item image')}" loading="lazy" decoding="async">`;
    }

    const gradientId = `placeholder-${item.id || Math.random().toString(16).slice(2)}`;
    return `
      <svg class="inventory-card__placeholder" viewBox="0 0 320 180" role="img" aria-label="No image available">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(56,248,255,0.35)"></stop>
            <stop offset="100%" stop-color="rgba(226,111,255,0.25)"></stop>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="320" height="180" rx="18" fill="rgba(11,15,23,0.85)" stroke="rgba(56,248,255,0.35)"></rect>
        <path d="M40 120 L110 60 L160 105 L210 75 L280 130" stroke="url(#${gradientId})" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        <circle cx="110" cy="60" r="10" fill="rgba(56,248,255,0.8)"></circle>
        <circle cx="210" cy="75" r="10" fill="rgba(226,111,255,0.8)"></circle>
      </svg>
    `;
  }

  function renderSkeletons(count) {
    clearGrid();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const skeleton = document.createElement('article');
      skeleton.className = 'inventory-card skeleton';
      skeleton.setAttribute('aria-hidden', 'true');
      skeleton.innerHTML = `
        <div class="inventory-card__media skeleton__block"></div>
        <div class="inventory-card__body">
          <div class="skeleton__line skeleton__line--wide"></div>
          <div class="skeleton__line skeleton__line--medium"></div>
          <div class="skeleton__line skeleton__line--short"></div>
          <div class="skeleton__meta">
            <span class="skeleton__chip"></span>
            <span class="skeleton__chip"></span>
            <span class="skeleton__chip skeleton__chip--wide"></span>
          </div>
        </div>
      `;
      fragment.appendChild(skeleton);
    }
    grid.appendChild(fragment);
  }

  function clearSkeletons() {
    grid.querySelectorAll('.skeleton').forEach((node) => node.remove());
  }

  function clearGrid() {
    grid.innerHTML = '';
  }

  function renderEmptyState(message) {
    clearGrid();
    const container = document.createElement('div');
    container.className = 'empty-state';
    container.setAttribute('role', 'note');
    container.innerHTML = `
      <h3>No Results</h3>
      <p>${escapeHtml(message)}</p>
    `;
    grid.appendChild(container);
  }

  function renderErrorState(message) {
    clearGrid();
    const container = document.createElement('div');
    container.className = 'empty-state empty-state--error';
    container.innerHTML = `
      <h3>Connection issue</h3>
      <p>${escapeHtml(message)}</p>
    `;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'toolbar__button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => fetchInventory({ reset: true }));
    container.appendChild(retry);
    grid.appendChild(container);
  }

  function updateResultsCounter() {
    if (!state.items.length) {
      resultsCount.textContent = 'No results';
      return;
    }
    const moreIndicator = state.cursor ? ' • More available' : '';
    resultsCount.textContent = `Showing ${state.items.length} item${state.items.length === 1 ? '' : 's'}${moreIndicator}`;
  }

  function setLoadMoreState(isLoading) {
    if (loadMoreBtn.hidden) {
      return;
    }
    loadMoreBtn.disabled = isLoading;
    loadMoreBtn.textContent = isLoading ? 'Loading…' : 'Load more';
  }

  function showToast(message, isError) {
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.toggle('toast--error', Boolean(isError));
    toast.classList.add('toast--visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 4200);
  }

  function detachAllTilt() {
    if (!window.HoloTilt) {
      return;
    }
    state.cards.forEach((card) => {
      window.HoloTilt.detach(card);
      card.setAttribute('data-tilt', 'false');
    });
  }

  function reattachTilt() {
    if (!window.HoloTilt) {
      return;
    }
    state.cards.forEach((card) => {
      window.HoloTilt.attach(card);
      card.setAttribute('data-tilt', 'true');
    });
  }

  function relativeTimeFromNow(value) {
    if (!value) {
      return 'Updated just now';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Updated recently';
    }
    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(diffSeconds);
    if (absSeconds < 45) {
      return 'Updated just now';
    }
    const units = [
      { unit: 'year', value: 31536000 },
      { unit: 'month', value: 2592000 },
      { unit: 'week', value: 604800 },
      { unit: 'day', value: 86400 },
      { unit: 'hour', value: 3600 },
      { unit: 'minute', value: 60 },
      { unit: 'second', value: 1 }
    ];
    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      if (absSeconds >= unit.value || unit.unit === 'second') {
        const rounded = Math.round(diffSeconds / unit.value);
        return `Updated ${relativeTimeFormatter.format(rounded, unit.unit)}`;
      }
    }
    return 'Updated recently';
  }

  function truncate(text, limit) {
    const normalized = String(text);
    if (normalized.length <= limit) {
      return normalized;
    }
    return `${normalized.slice(0, limit - 1)}…`;
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (char) => {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return map[char] || char;
    });
  }

  function sanitizeUrl(url) {
    if (!url) {
      return null;
    }
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.href;
    } catch (error) {
      return null;
    }
  }
})();
