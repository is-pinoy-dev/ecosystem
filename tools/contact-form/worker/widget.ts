/**
 * The popup contact-form widget, injected onto a hosted portfolio's page by
 * `tools/portfolio-proxy` right before `</body>`.
 *
 * Vanilla JS, dependency-free, served as a static string from
 * `GET /_tools/contact-form/widget.js`. Deliberately compact rather than
 * minified — it is small enough to read as shipped.
 *
 * IMPORTANT: the portfolio renderer's CSP sets `form-action 'none'`, which
 * blocks any native `<form>` submission outright (see
 * apps/portfolio/next.config.mjs, apps/portfolio/tests/csp.test.ts). The
 * submit handler below MUST call `fetch()` with `e.preventDefault()` — never
 * let the browser submit the form itself, or every message silently fails
 * the CSP check with nothing but a console warning to show for it.
 */
export const WIDGET_SCRIPT = `(function () {
  "use strict";

  var subdomain = window.location.hostname.split(".")[0];
  var configUrl = "/_tools/contact-form/config";
  var submitUrl = "/_tools/contact-form/submit";
  var turnstileSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    for (var key in attrs || {}) {
      if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) {
      node.appendChild(child);
    });
    return node;
  }

  fetch(configUrl)
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .catch(function () {
      return null;
    })
    .then(function (config) {
      if (!config || !config.enabled || !config.turnstileSiteKey) return;
      mount(config.turnstileSiteKey);
    });

  function mount(siteKey) {
    var button = el("button", {
      type: "button",
      "aria-label": "Contact " + subdomain,
      style:
        "position:fixed;right:20px;bottom:20px;z-index:2147483000;" +
        "width:56px;height:56px;border-radius:50%;border:none;" +
        "background:#175CD3;color:#fff;font-family:system-ui,sans-serif;" +
        "font-size:24px;line-height:56px;text-align:center;cursor:pointer;" +
        "box-shadow:0 2px 8px rgba(0,0,0,.25);",
      text: "\\u2709",
    });

    var overlay = el("div", {
      style:
        "position:fixed;inset:0;z-index:2147483001;display:none;" +
        "align-items:center;justify-content:center;" +
        "background:rgba(11,31,68,.45);font-family:system-ui,sans-serif;",
    });

    var status = el("p", {
      style: "margin:0 0 8px;font-size:13px;min-height:16px;",
    });

    var nameInput = el("input", {
      name: "name",
      placeholder: "Your name",
      required: "required",
      style: fieldStyle(),
    });
    var emailInput = el("input", {
      name: "email",
      type: "email",
      placeholder: "Your email",
      required: "required",
      style: fieldStyle(),
    });
    var messageInput = el("textarea", {
      name: "message",
      placeholder: "Message",
      required: "required",
      rows: "4",
      style: fieldStyle() + "resize:vertical;",
    });
    var turnstileHost = el("div", { class: "cf-turnstile" });
    var submitButton = el("button", {
      type: "submit",
      style:
        "width:100%;padding:10px;border:none;border-radius:6px;" +
        "background:#175CD3;color:#fff;font-size:14px;cursor:pointer;",
      text: "Send message",
    });
    var closeButton = el("button", {
      type: "button",
      "aria-label": "Close",
      style:
        "position:absolute;top:8px;right:10px;border:none;background:none;" +
        "font-size:20px;line-height:1;cursor:pointer;color:#667085;",
      text: "\\u00d7",
    });

    var form = el(
      "form",
      {
        style:
          "position:relative;width:min(360px,90vw);background:#fff;" +
          "border-radius:10px;padding:24px;box-shadow:0 8px 30px rgba(0,0,0,.2);",
      },
      [
        closeButton,
        el("h2", {
          style: "margin:0 0 12px;font-size:16px;color:#0B1F44;",
          text: "Message " + subdomain,
        }),
        status,
        nameInput,
        emailInput,
        messageInput,
        turnstileHost,
        submitButton,
      ]
    );

    overlay.appendChild(form);
    document.body.appendChild(button);
    document.body.appendChild(overlay);

    function fieldStyle() {
      return (
        "display:block;width:100%;margin-bottom:10px;padding:8px 10px;" +
        "border:1px solid #D0D5DD;border-radius:6px;font-size:14px;" +
        "box-sizing:border-box;"
      );
    }

    function open() {
      overlay.style.display = "flex";
      loadTurnstile(siteKey, turnstileHost);
    }
    function close() {
      overlay.style.display = "none";
    }

    button.addEventListener("click", open);
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    // Never a native submission — form-action is blocked by the portfolio's
    // CSP, so this must go through fetch() or every message silently fails.
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "Sending\\u2026";
      submitButton.disabled = true;

      var tokenInput = turnstileHost.querySelector(
        "textarea,input[name='cf-turnstile-response']"
      );
      var token = tokenInput ? tokenInput.value : "";

      fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value,
          email: emailInput.value,
          message: messageInput.value,
          token: token,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          submitButton.disabled = false;
          if (result.ok) {
            status.textContent = "Message sent \\u2014 thank you!";
            status.style.color = "#168253";
            form.reset();
            setTimeout(close, 1800);
          } else {
            status.textContent =
              (result.data && result.data.error) ||
              "Could not send your message. Please try again.";
            status.style.color = "#B42318";
            if (window.turnstile) window.turnstile.reset();
          }
        })
        .catch(function () {
          submitButton.disabled = false;
          status.textContent = "Network error \\u2014 please try again.";
          status.style.color = "#B42318";
        });
    });
  }

  function loadTurnstile(siteKey, host) {
    if (host.dataset.rendered) {
      if (window.turnstile) window.turnstile.reset();
      return;
    }
    host.dataset.rendered = "1";
    host.setAttribute("data-sitekey", siteKey);

    if (window.turnstile) {
      window.turnstile.render(host);
      return;
    }
    var script = document.createElement("script");
    script.src = turnstileSrc;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
})();
`
