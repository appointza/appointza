/** Runtime contact-form support for published template HTML (builder + legacy saves). */

const HANDLER_SCRIPT_ID = "appointza-contact-handler";

export function upgradeContactFormsInHtml(html: string, organisationId: number): string {
  if (!html.includes("az-form") && !html.includes('id="contact"')) {
    return html;
  }

  const orgId = organisationId > 0 ? organisationId : 0;

  let out = html.replace(
    /<form(\s[^>]*class="[^"]*az-form[^"]*"[^>]*)>/gi,
    (_match, attrs: string) => {
      let next = attrs.replace(/\s*onsubmit="[^"]*"/gi, "");
      if (!/\bdata-appointza-contact\b/i.test(next)) {
        next += " data-appointza-contact novalidate";
      }
      if (/\bdata-organisation-id=/i.test(next)) {
        next = next.replace(/\bdata-organisation-id="[^"]*"/i, `data-organisation-id="${orgId}"`);
      } else {
        next += ` data-organisation-id="${orgId}"`;
      }
      return `<form${next}>`;
    },
  );

  if (out.includes('name="organisation_id"')) {
    out = out.replace(
      /(<input[^>]*name="organisation_id"[^>]*value=")[^"]*(")/gi,
      `$1${orgId}$2`,
    );
  }

  // Legacy builder markup: inputs without name attributes.
  if (out.includes("az-form") && !out.includes('name="name"')) {
    out = out.replace(
      /(<form[^>]*class="[^"]*az-form[^"]*"[^>]*>)([\s\S]*?)(<\/form>)/i,
      (_full, open: string, inner: string, close: string) => {
        let body = inner;
        if (!body.includes('name="name"')) {
          body = body.replace(
            /<input(?![^>]*\bname=)([^>]*placeholder="Your name"[^>]*)\/?>/i,
            '<input name="name" type="text"$1 />',
          );
        }
        if (!body.includes('name="email"')) {
          body = body.replace(
            /<input(?![^>]*\bname=)([^>]*type="email"[^>]*)\/?>/i,
            '<input name="email"$1 />',
          );
        }
        if (!body.includes('name="phone"')) {
          body = body.replace(
            /<input(?![^>]*\bname=)([^>]*type="tel"[^>]*)\/?>/i,
            '<input name="phone"$1 />',
          );
        }
        if (!body.includes('name="message"')) {
          body = body.replace(
            /<textarea(?![^>]*\bname=)([^>]*)>/i,
            '<textarea name="message"$1>',
          );
        }
        if (!body.includes('name="subject"')) {
          body = body.replace(
            /(<button[^>]*type="submit")/i,
            `<input type="hidden" name="subject" value="Website enquiry" />\n    <input type="hidden" name="organisation_id" value="${orgId}" />\n    <p class="az-form-status" role="status" aria-live="polite"></p>\n    $1`,
          );
        } else if (!body.includes('name="organisation_id"')) {
          body = body.replace(
            /(<button[^>]*type="submit")/i,
            `<input type="hidden" name="organisation_id" value="${orgId}" />\n    <p class="az-form-status" role="status" aria-live="polite"></p>\n    $1`,
          );
        } else if (!body.includes("az-form-status")) {
          body = body.replace(
            /(<button[^>]*type="submit")/i,
            `<p class="az-form-status" role="status" aria-live="polite"></p>\n    $1`,
          );
        }
        return `${open}${body}${close}`;
      },
    );
  }

  return out;
}

export function buildContactFormHandlerScript(apiBase: string, organisationId = 0): string {
  const base = (apiBase || "").replace(/\/+$/, "");
  const orgId = organisationId > 0 ? organisationId : 0;
  return `
<script id="${HANDLER_SCRIPT_ID}">
(function(){
  if (window.__appointzaContactBound) return;
  window.__appointzaContactBound = true;
  var apiBase = ${JSON.stringify(base || window.location.origin)};
  var defaultOrganisationId = ${orgId};
  document.addEventListener('submit', function(ev) {
    var form = ev.target;
    if (!form || !form.getAttribute || form.getAttribute('data-appointza-contact') === null) return;
    ev.preventDefault();
    var statusEl = form.querySelector('.az-form-status');
    var btn = form.querySelector('button[type="submit"]');
    var setStatus = function(msg, ok) {
      if (!statusEl) return;
      statusEl.textContent = msg || '';
      statusEl.style.color = ok ? '#059669' : '#dc2626';
    };
    var getVal = function(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? String(el.value || '').trim() : '';
    };
    var formOrgId = parseInt(form.getAttribute('data-organisation-id') || '0', 10) || 0;
    var payload = {
      name: getVal('name'),
      email: getVal('email'),
      phone: getVal('phone'),
      subject: getVal('subject') || 'Website enquiry',
      message: getVal('message'),
      organisation_id: parseInt(getVal('organisation_id') || '0', 10) || formOrgId || defaultOrganisationId || 0
    };
    if (!payload.name || !payload.email || !payload.message) {
      setStatus('Please fill in all required fields.', false);
      return;
    }
    if (btn) {
      btn.disabled = true;
      if (!btn.dataset.prevLabel) btn.dataset.prevLabel = btn.textContent || '';
      btn.textContent = 'Sending…';
    }
    setStatus('', true);
    fetch(apiBase + '/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function(r) { return r.json().then(function(j) { return { ok: r.ok, body: j }; }); })
      .then(function(res) {
        if (res.ok && res.body && res.body.success) {
          setStatus(res.body.message || 'Thanks! We will get back to you soon.', true);
          var subjectEl = form.querySelector('input[name="subject"]');
          var orgEl = form.querySelector('input[name="organisation_id"]');
          var subjectVal = subjectEl ? subjectEl.value : '';
          var orgVal = orgEl ? orgEl.value : '';
          form.reset();
          if (subjectEl) subjectEl.value = subjectVal;
          if (orgEl) orgEl.value = orgVal;
        } else {
          throw new Error((res.body && res.body.message) || 'Could not send message.');
        }
      })
      .catch(function(err) {
        setStatus(err && err.message ? err.message : 'Could not send message. Please try again.', false);
      })
      .finally(function() {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.prevLabel || 'Send';
        }
      });
  });
})();
</script>`;
}

export function injectContactFormSupport(
  html: string,
  organisationId: number,
  apiBase: string,
): string {
  if (!html.includes("az-form") && !html.includes('id="contact"')) {
    return html;
  }

  let out = upgradeContactFormsInHtml(html, organisationId);

  // Drop any older inline contact handlers (builder export) before injecting the canonical one.
  out = out.replace(/<script(?:\s[^>]*)?>[\s\S]*?\/api\/contact[\s\S]*?<\/script>/gi, "");

  if (!out.includes(`id="${HANDLER_SCRIPT_ID}"`)) {
    const script = buildContactFormHandlerScript(apiBase, organisationId);
    if (out.indexOf("</body>") !== -1) {
      out = out.replace("</body>", `${script}\n</body>`);
    } else {
      out += script;
    }
  }

  return out;
}
