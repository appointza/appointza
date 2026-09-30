using System.Text.RegularExpressions;

namespace appointza.Utils
{
    /// <summary>
    /// Injects contact-form POST handling into published public-site HTML (same behaviour as
    /// appointza-ui-canvas/src/utils/templateContactForm.util.ts).
    /// </summary>
    public static class PublicTemplateContactForm
    {
        const string HandlerScriptId = "appointza-contact-handler";

        public static string Inject(string html, long organisationId, string apiBaseUrl)
        {
            var output = html ?? "";
            if (!output.Contains("az-form", StringComparison.OrdinalIgnoreCase)
                && !output.Contains("id=\"contact\"", StringComparison.OrdinalIgnoreCase)
                && !output.Contains("id='contact'", StringComparison.OrdinalIgnoreCase))
            {
                return output;
            }

            output = UpgradeForms(output, organisationId);
            output = Regex.Replace(
                output,
                @"<script(?:\s[^>]*)?>[\s\S]*?/api/contact[\s\S]*?</script>",
                "",
                RegexOptions.IgnoreCase);

            if (!output.Contains($"id=\"{HandlerScriptId}\"", StringComparison.Ordinal))
            {
                var script = BuildHandlerScript(apiBaseUrl, organisationId);
                if (output.Contains("</body>", StringComparison.OrdinalIgnoreCase))
                {
                    output = Regex.Replace(
                        output,
                        "</body>",
                        script + "\n</body>",
                        RegexOptions.IgnoreCase);
                }
                else
                {
                    output += script;
                }
            }

            return output;
        }

        static string UpgradeForms(string html, long organisationId)
        {
            var orgId = organisationId > 0 ? organisationId : 0L;
            var outHtml = html;

            outHtml = Regex.Replace(
                outHtml,
                @"<form(\s[^>]*class=""[^""]*az-form[^""]*""[^>]*)>",
                m =>
                {
                    var attrs = Regex.Replace(m.Groups[1].Value, @"\s*onsubmit=""[^""]*""", "", RegexOptions.IgnoreCase);
                    if (!Regex.IsMatch(attrs, @"\bdata-appointza-contact\b", RegexOptions.IgnoreCase))
                    {
                        attrs += " data-appointza-contact novalidate";
                    }

                    if (Regex.IsMatch(attrs, @"\bdata-organisation-id=", RegexOptions.IgnoreCase))
                    {
                        attrs = Regex.Replace(
                            attrs,
                            @"\bdata-organisation-id=""[^""]*""",
                            $@"data-organisation-id=""{orgId}""",
                            RegexOptions.IgnoreCase);
                    }
                    else
                    {
                        attrs += $@" data-organisation-id=""{orgId}""";
                    }

                    return $"<form{attrs}>";
                },
                RegexOptions.IgnoreCase);

            outHtml = Regex.Replace(
                outHtml,
                @"(<section\b[^>]*\bid=[""']contact[""'][^>]*>)([\s\S]*?)(</section>)",
                m =>
                {
                    var inner = Regex.Replace(
                        m.Groups[2].Value,
                        @"<form(\s[^>]*)(>)",
                        fm =>
                        {
                            if (Regex.IsMatch(fm.Groups[1].Value, @"\bdata-appointza-contact\b", RegexOptions.IgnoreCase))
                            {
                                return fm.Value;
                            }

                            var attrs = Regex.Replace(fm.Groups[1].Value, @"\s*onsubmit=""[^""]*""", "", RegexOptions.IgnoreCase);
                            attrs += $@" data-appointza-contact novalidate data-organisation-id=""{orgId}""";
                            return $"<form{attrs}{fm.Groups[2].Value}";
                        },
                        RegexOptions.IgnoreCase);
                    return m.Groups[1].Value + inner + m.Groups[3].Value;
                },
                RegexOptions.IgnoreCase);

            if (outHtml.Contains("name=\"organisation_id\"", StringComparison.OrdinalIgnoreCase))
            {
                outHtml = Regex.Replace(
                    outHtml,
                    @"(<input[^>]*name=""organisation_id""[^>]*value="")[^""]*("")",
                    $"$1{orgId}$2",
                    RegexOptions.IgnoreCase);
            }

            return outHtml;
        }

        static string BuildHandlerScript(string apiBaseUrl, long organisationId)
        {
            var baseUrl = (apiBaseUrl ?? "").TrimEnd('/');
            var orgId = organisationId > 0 ? organisationId : 0;
            var escapedBase = System.Text.Json.JsonSerializer.Serialize(baseUrl);

            return $@"
<script id=""{HandlerScriptId}"">
(function(){{
  if (window.__appointzaContactBound) return;
  window.__appointzaContactBound = true;
  var apiBase = {escapedBase} || window.location.origin;
  var defaultOrganisationId = {orgId};
  document.addEventListener('submit', function(ev) {{
    var form = ev.target;
    if (!form || !form.getAttribute || form.getAttribute('data-appointza-contact') === null) return;
    ev.preventDefault();
    var statusEl = form.querySelector('.az-form-status');
    var btn = form.querySelector('button[type=""submit""]');
    var setStatus = function(msg, ok) {{
      if (!statusEl) return;
      statusEl.textContent = msg || '';
      statusEl.style.color = ok ? '#059669' : '#dc2626';
    }};
    var getVal = function(name) {{
      var el = form.querySelector('[name=""' + name + '""]');
      return el ? String(el.value || '').trim() : '';
    }};
    var formOrgId = parseInt(form.getAttribute('data-organisation-id') || '0', 10) || 0;
    var payload = {{
      name: getVal('name'),
      email: getVal('email'),
      phone: getVal('phone'),
      subject: getVal('subject') || 'Website enquiry',
      message: getVal('message'),
      organisation_id: parseInt(getVal('organisation_id') || '0', 10) || formOrgId || defaultOrganisationId || 0
    }};
    if (!payload.name || !payload.email || !payload.message) {{
      setStatus('Please fill in all required fields.', false);
      return;
    }}
    if (btn) {{
      btn.disabled = true;
      if (!btn.dataset.prevLabel) btn.dataset.prevLabel = btn.textContent || '';
      btn.textContent = 'Sending…';
    }}
    setStatus('', true);
    fetch(apiBase + '/api/contact', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify(payload)
    }})
      .then(function(r) {{ return r.json().then(function(j) {{ return {{ ok: r.ok, body: j }}; }}); }})
      .then(function(res) {{
        if (res.ok && res.body && res.body.success) {{
          setStatus(res.body.message || 'Thanks! We will get back to you soon.', true);
          var subjectEl = form.querySelector('input[name=""subject""]');
          var orgEl = form.querySelector('input[name=""organisation_id""]');
          var subjectVal = subjectEl ? subjectEl.value : '';
          var orgVal = orgEl ? orgEl.value : '';
          form.reset();
          if (subjectEl) subjectEl.value = subjectVal;
          if (orgEl) orgEl.value = orgVal;
        }} else {{
          throw new Error((res.body && res.body.message) || 'Could not send message.');
        }}
      }})
      .catch(function(err) {{
        setStatus(err && err.message ? err.message : 'Could not send message. Please try again.', false);
      }})
      .finally(function() {{
        if (btn) {{
          btn.disabled = false;
          btn.textContent = btn.dataset.prevLabel || 'Send';
        }}
      }});
  }});
}})();
</script>";
        }
    }
}
