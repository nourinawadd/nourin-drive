(function () {
  "use strict";

  var body = document.body;

  var API = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
    ? body.dataset.apiDev
    : body.dataset.api;

  var slug = body.dataset.slug || "";

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  function shortDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function errorFrom(res, data, fallback) {
    if (data && data.error) return data.error;
    if (res && res.status === 429) return "Slow down a moment — try again in a bit.";
    return fallback;
  }

  function json(url, options) {
    return fetch(url, options).then(function (res) {
      return res
        .json()
        .catch(function () { return null; })
        .then(function (data) {
          if (!res.ok) throw new Error(errorFrom(res, data, "Something went wrong (" + res.status + ")."));
          return data;
        });
    });
  }

  function views() {
    var out = document.getElementById("view-count");
    if (!out || !slug || !API) return;

    var key = "blog-viewed:" + slug;
    var counted = false;
    try { counted = sessionStorage.getItem(key) === "1"; } catch (e) {}

    var request = counted
      ? json(API + "/api/blog/" + encodeURIComponent(slug) + "/stats")
      : json(API + "/api/blog/" + encodeURIComponent(slug) + "/view", { method: "POST" });

    request
      .then(function (data) {
        if (!counted) {
          try { sessionStorage.setItem(key, "1"); } catch (e) {}
        }
        var n = (data && data.views) || 0;
        out.textContent = "▸ read " + n.toLocaleString("en-US") + (n === 1 ? " time" : " times");
      })
      .catch(function () {});
  }

  function commentNode(c) {
    var wrap = el("article", "comment");

    var head = el("div", "comment-head");
    var name = (c.name || "").trim();
    head.appendChild(el("span", name ? "who" : "who anon", name || "anonymous"));
    if (c.seq) head.appendChild(el("span", null, "#" + c.seq));
    head.appendChild(el("span", null, shortDate(c.createdAt)));
    wrap.appendChild(head);

    wrap.appendChild(el("p", "comment-body", c.message || ""));

    if (c.reply) {
      var reply = el("div", "comment-reply");
      reply.appendChild(el("span", "who", "nourin replied"));
      reply.appendChild(el("p", null, c.reply));
      wrap.appendChild(reply);
    }
    return wrap;
  }

  function paint(list, comments) {
    list.textContent = "";
    if (!comments.length) {
      list.appendChild(el("p", "note", "No comments yet. Be the first, if you like."));
      return;
    }
    comments.forEach(function (c) { list.appendChild(commentNode(c)); });
  }

  function comments() {
    var list = document.getElementById("comment-list");
    var form = document.getElementById("comment-form");
    if (!list || !form || !slug) return;

    if (!API) {
      list.textContent = "";
      list.appendChild(el("p", "note", "Comments are unavailable here."));
      form.hidden = true;
      return;
    }

    var url = API + "/api/blog/" + encodeURIComponent(slug) + "/comments";
    var nameInput = document.getElementById("c-name");
    var messageInput = document.getElementById("c-message");
    var honeypot = document.getElementById("c-website");
    var submit = document.getElementById("c-submit");
    var status = document.getElementById("c-status");
    var counter = document.getElementById("c-count");

    json(url)
      .then(function (data) { paint(list, data || []); })
      .catch(function () {
        list.textContent = "";
        list.appendChild(el("p", "note", "Couldn't load the comments — the server may be asleep."));
      });

    try {
      var saved = localStorage.getItem("blog-name");
      if (saved) nameInput.value = saved;
    } catch (e) {}

    function updateCount() {
      counter.textContent = messageInput.value.length + " / 1000";
    }
    messageInput.addEventListener("input", updateCount);
    updateCount();

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var message = messageInput.value.trim();
      var name = nameInput.value.trim();

      status.className = "note";
      if (!message) {
        status.className = "note bad";
        status.textContent = "Write something first.";
        messageInput.focus();
        return;
      }
      if (honeypot && honeypot.value) {
        form.reset();
        status.textContent = "Thanks!";
        return;
      }

      submit.disabled = true;
      status.textContent = "sending…";

      json(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, message: message }),
      })
        .then(function (created) {
          var empty = list.querySelector(".note");
          if (empty) list.textContent = "";
          list.appendChild(commentNode(created));
          messageInput.value = "";
          updateCount();
          status.textContent = "Posted. Thank you :)";
          try {
            if (name) localStorage.setItem("blog-name", name);
            else localStorage.removeItem("blog-name");
          } catch (err) {}
        })
        .catch(function (err) {
          status.className = "note bad";
          status.textContent = err.message;
        })
        .then(function () {
          submit.disabled = false;
        });
    });
  }

  function search() {
    var toggle = document.getElementById("search-toggle");
    var panel = document.getElementById("search");
    var input = document.getElementById("search-input");
    var results = document.getElementById("search-results");
    if (!toggle || !panel || !input || !results) return;

    var index = null;

    toggle.addEventListener("click", function () {
      var open = panel.hasAttribute("open");
      if (open) {
        panel.removeAttribute("open");
        toggle.setAttribute("aria-expanded", "false");
        return;
      }
      panel.setAttribute("open", "");
      toggle.setAttribute("aria-expanded", "true");
      input.focus();

      if (index === null) {
        index = [];
        json("/search-index.json")
          .then(function (data) { index = data || []; run(); })
          .catch(function () { index = []; });
      }
    });

    function run() {
      var q = input.value.trim().toLowerCase();
      results.textContent = "";
      if (!q || !index) return;

      var hits = index.filter(function (p) {
        return (
          p.title.toLowerCase().indexOf(q) !== -1 ||
          p.summary.toLowerCase().indexOf(q) !== -1 ||
          p.tags.join(" ").toLowerCase().indexOf(q) !== -1
        );
      });

      if (!hits.length) {
        results.appendChild(el("li", "why", "nothing matches “" + q + "”"));
        return;
      }

      hits.slice(0, 20).forEach(function (p) {
        var li = el("li");
        var a = el("a", null, p.title);
        a.href = "/posts/" + p.slug + ".html";
        li.appendChild(a);
        li.appendChild(el("div", "why", shortDate(p.date) + (p.tags.length ? " · " + p.tags.join(", ") : "")));
        results.appendChild(li);
      });
    }

    input.addEventListener("input", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        panel.removeAttribute("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  views();
  comments();
  search();
})();
