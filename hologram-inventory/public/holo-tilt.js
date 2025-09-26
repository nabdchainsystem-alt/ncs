(function (global) {
  'use strict';

  const MAX_TILT = 10;
  const LERP_SPEED = 0.18;
  const store = new WeakMap();

  function lerp(start, end, amt) {
    return start + (end - start) * amt;
  }

  function attach(element) {
    if (!element || store.has(element)) {
      return;
    }

    element.setAttribute('data-tilt', 'true');
    element.style.setProperty('--tilt-x', '0deg');
    element.style.setProperty('--tilt-y', '0deg');
    element.style.setProperty('--glare-x', '50%');
    element.style.setProperty('--glare-y', '50%');

    const state = {
      element,
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
      glareX: 50,
      glareY: 50,
      targetGlareX: 50,
      targetGlareY: 50,
      requestId: null
    };

    const pointerMove = (event) => {
      const rect = element.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width;
      const offsetY = (event.clientY - rect.top) / rect.height;
      const clampedX = Math.min(Math.max(offsetX, 0), 1);
      const clampedY = Math.min(Math.max(offsetY, 0), 1);

      state.targetY = (clampedX - 0.5) * 2 * MAX_TILT;
      state.targetX = (0.5 - clampedY) * 2 * MAX_TILT;
      state.targetGlareX = clampedX * 100;
      state.targetGlareY = clampedY * 100;

      schedule(state);
    };

    const pointerLeave = () => {
      state.targetX = 0;
      state.targetY = 0;
      state.targetGlareX = 50;
      state.targetGlareY = 50;
      schedule(state);
    };

    const focusHandler = () => {
      element.classList.add('inventory-card--focused');
    };

    const blurHandler = () => {
      element.classList.remove('inventory-card--focused');
      pointerLeave();
    };

    element.addEventListener('pointermove', pointerMove);
    element.addEventListener('pointerenter', pointerMove);
    element.addEventListener('pointerleave', pointerLeave);
    element.addEventListener('touchend', pointerLeave, { passive: true });
    element.addEventListener('focus', focusHandler);
    element.addEventListener('blur', blurHandler);

    store.set(element, { pointerMove, pointerLeave, focusHandler, blurHandler, state });

    schedule(state);
  }

  function detach(element) {
    const record = store.get(element);
    if (!record) {
      return;
    }

    element.removeEventListener('pointermove', record.pointerMove);
    element.removeEventListener('pointerenter', record.pointerMove);
    element.removeEventListener('pointerleave', record.pointerLeave);
    element.removeEventListener('touchend', record.pointerLeave);
    element.removeEventListener('focus', record.focusHandler);
    element.removeEventListener('blur', record.blurHandler);

    if (record.state.requestId) {
      cancelAnimationFrame(record.state.requestId);
    }

    element.removeAttribute('data-tilt');
    element.classList.remove('inventory-card--focused');
    element.style.removeProperty('--tilt-x');
    element.style.removeProperty('--tilt-y');
    element.style.removeProperty('--glare-x');
    element.style.removeProperty('--glare-y');

    store.delete(element);
  }

  function schedule(state) {
    if (state.requestId) {
      return;
    }
    state.requestId = requestAnimationFrame(() => apply(state));
  }

  function apply(state) {
    state.requestId = null;

    state.currentX = lerp(state.currentX, state.targetX, LERP_SPEED);
    state.currentY = lerp(state.currentY, state.targetY, LERP_SPEED);
    state.glareX = lerp(state.glareX, state.targetGlareX, LERP_SPEED);
    state.glareY = lerp(state.glareY, state.targetGlareY, LERP_SPEED);

    const { element } = state;
    element.style.setProperty('--tilt-x', `${state.currentX.toFixed(2)}deg`);
    element.style.setProperty('--tilt-y', `${state.currentY.toFixed(2)}deg`);
    element.style.setProperty('--glare-x', `${state.glareX.toFixed(2)}%`);
    element.style.setProperty('--glare-y', `${state.glareY.toFixed(2)}%`);

    const stillMoving =
      Math.abs(state.currentX - state.targetX) > 0.01 ||
      Math.abs(state.currentY - state.targetY) > 0.01 ||
      Math.abs(state.glareX - state.targetGlareX) > 0.1 ||
      Math.abs(state.glareY - state.targetGlareY) > 0.1;

    if (stillMoving) {
      schedule(state);
    }
  }

  global.HoloTilt = Object.freeze({
    attach,
    detach
  });
})(window);
