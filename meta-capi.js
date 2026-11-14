/*!
 * Meta Pixel + CAPI dedup helper
 * Pasang SETELAH kode dasar Meta Pixel (fbq sudah ada).
 *
 * Pakai:
 *   MetaCAPI.init({ endpoint: 'https://api.tokokamu.com/api/meta-event' });
 *   MetaCAPI.track('Purchase', {
 *     orderId: 'INV-1001', value: 142.52, currency: 'GBP',
 *     email: 'pembeli@email.com', phone: '+447911123456'
 *   });
 */
(function (w) {
  var cfg = { endpoint: '/api/meta-event' };

  function getCookie(n) {
    var m = document.cookie.match('(^|;)\\s*' + n + '=([^;]+)');
    return m ? decodeURIComponent(m[2]) : undefined;
  }

  function uuid() {
    if (w.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  }

  // fbc dari ?fbclid kalau cookie _fbc belum ada
  function getFbc() {
    var c = getCookie('_fbc');
    if (c) return c;
    var id = new URLSearchParams(location.search).get('fbclid');
    return id ? 'fb.1.' + Date.now() + '.' + id : undefined;
  }

  // event_id stabil: Purchase pakai orderId, jadi refresh tidak membuat ID baru
  function makeEventId(name, orderId) {
    if (orderId) return name.toLowerCase() + '_' + orderId;
    return name.toLowerCase() + '_' + uuid();
  }

  function alreadySent(id) {
    try { return localStorage.getItem('mcapi_' + id) === '1'; } catch (e) { return false; }
  }
  function markSent(id) {
    try { localStorage.setItem('mcapi_' + id, '1'); } catch (e) {}
  }

  w.MetaCAPI = {
    init: function (o) { cfg = Object.assign(cfg, o || {}); },

    track: function (eventName, d) {
      d = d || {};
      var eventId = d.eventId || makeEventId(eventName, d.orderId);

      if (d.orderId && alreadySent(eventId)) return eventId; // cegah dobel saat refresh

      var custom = {};
      if (d.value !== undefined) custom.value = d.value;
      if (d.currency) custom.currency = d.currency;
      if (d.contents) custom.contents = d.contents;

      // 1) Browser (Pixel), eventID = event_id server
      if (typeof w.fbq === 'function') {
        w.fbq('track', eventName, custom, { eventID: eventId });
      }

      // 2) Server (CAPI) lewat backend kamu, event_id SAMA
      var payload = {
        event_name: eventName,
        event_id: eventId,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: location.href,
        order_id: d.orderId,
        value: d.value,
        currency: d.currency,
        contents: d.contents,
        email: d.email,
        phone: d.phone,
        first_name: d.firstName,
        last_name: d.lastName,
        external_id: d.externalId,
        fbp: getCookie('_fbp'),
        fbc: getFbc()
      };

      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).then(function (r) {
        if (r.ok && d.orderId) markSent(eventId);
      }).catch(function () {});

      return eventId;
    }
  };
})(window);
