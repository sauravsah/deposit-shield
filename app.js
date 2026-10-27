/* Deposit Shield — client-side only. All data stays in this browser (localStorage). */
(function () {
  "use strict";
  var $ = function (sel) { return document.querySelector(sel); };
  var fmt = function (n) { return "\u20B9" + Number(n || 0).toLocaleString("en-IN"); };

  /* ---------- tabs ---------- */
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
      document.querySelectorAll(".panel").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      $("#tab-" + t.dataset.tab).classList.add("active");
      window.scrollTo({ top: 0 });
    });
  });

  /* ---------- move-in checklist ---------- */
  var GROUPS = [
    { name: "Day one: the evidence file", items: [
      ["Photos/video of every wall, fitting and appliance, date-stamped", "Include the marks that already exist. They are your defence later."],
      ["Sent the photos to the landlord on WhatsApp same day", "Ask for a one-line acknowledgment. A record both sides saw beats ten you kept private."],
      ["Meter readings photographed (electricity + water)", "Date them. Prevents 'unpaid bills' surprises."],
      ["Owner identity verified (khata / sale-deed name match)", "Sublet-and-vanish deposit fraud is real in high-churn areas."],
      ["Deposit paid by bank transfer with a note", "Never cash. The trail is evidence."],
    ]},
    { name: "Before signing: the clauses that decide your refund", items: [
      ["Painting clause negotiated (pro-rata, waived after 24 months, or invoice-only)", "The most abused clause in Bengaluru; one month's rent for painting is normalized, not lawful."],
      ["Refund date written in (a date, not 'after inspection')", "Model Tenancy Act says refund on vacant possession; write the date down."],
      ["Lock-in and notice-period forfeiture understood", "Know exactly what leaving early costs."],
      ["Rent escalation capped at 5%", "Some landlords impose 10% against the agreement; cap it in writing."],
      ["Agreement registered (not just notarized soft copy)", "Changes your legal position entirely if the exit turns hostile."],
      ["You hold your own signed copy", "One landlord withheld \u20B910,000 until the tenant returned her copy."],
    ]},
    { name: "During the tenancy", items: [
      ["Rent receipts or bank trail every month", "No exceptions."],
      ["Repairs reported in writing, replies kept", "Verbal 'I'll fix it' disappears at move-out."],
      ["One folder holds agreement, payments, photos, messages", "Scrambling for evidence months later is how disputes are lost."],
    ]},
    { name: "Move-out week", items: [
      ["Exit walkthrough video, every room, dated", "Same day as cleaning."],
      ["Professional deep clean paid by you, receipt kept", "Prices the cleaning claim at market instead of leaving it open."],
      ["Keys handed over in writing with date and meter readings", "Written handover starts the refund clock."],
      ["No full-and-final signed under pressure", "Once signed, it is the landlord's shield."],
    ]},
  ];
  var KEY = "dshield.movein.v1";
  var state = JSON.parse(localStorage.getItem(KEY) || "[]");

  function buildChecklist() {
    var html = "", idx = 0;
    GROUPS.forEach(function (g) {
      html += '<div class="group"><h3>' + g.name + "</h3>";
      g.items.forEach(function (it) {
        var checked = state.indexOf(idx) > -1 ? " checked" : "";
        html += '<div class="item"><input type="checkbox" data-idx="' + idx + '"' + checked +
          ' id="mi' + idx + '"><label for="mi' + idx + '">' + it[0] +
          '<span class="why">' + it[1] + "</span></label></div>";
        idx++;
      });
      html += "</div>";
    });
    $("#mi-groups").innerHTML = html;
    $("#mi-groups").addEventListener("change", function (e) {
      if (e.target.type !== "checkbox") return;
      var i = Number(e.target.dataset.idx);
      var at = state.indexOf(i);
      if (e.target.checked && at === -1) state.push(i);
      if (!e.target.checked && at > -1) state.splice(at, 1);
      localStorage.setItem(KEY, JSON.stringify(state));
      updateProgress();
    });
    updateProgress();
  }
  function updateProgress() {
    var total = 0, done = 0;
    GROUPS.forEach(function (g) { total += g.items.length; });
    done = state.length;
    $("#mi-progress").style.width = (total ? (done / total) * 100 : 0) + "%";
    $("#mi-progresslabel").textContent = done + " of " + total + " done" + (done === total && total ? " \u2014 your evidence file is complete" : "");
  }
  function summaryText() {
    var out = "Move-in deposit record \u2014 " + new Date().toLocaleDateString("en-IN") + "\n\n";
    var idx = 0;
    GROUPS.forEach(function (g) {
      out += g.name + ":\n";
      g.items.forEach(function (it) {
        out += (state.indexOf(idx) > -1 ? "[x] " : "[ ] ") + it[0] + "\n";
        idx++;
      });
      out += "\n";
    });
    out += "Prepared with Deposit Shield (deposit evidence kit). Not legal advice.";
    return out;
  }
  buildChecklist();
  $("#mi-copy").addEventListener("click", function () {
    var txt = summaryText();
    var lanlordNote = "\n\nHi, sharing my move-in condition record for the flat today (dated photos, meter readings). Requesting a one-line confirmation that you've seen it. Thanks!";
    navigator.clipboard.writeText(txt + lanlordNote).then(function () {
      $("#mi-copyhint").textContent = "Copied. Paste it to the landlord on WhatsApp and ask for that one-line acknowledgment.";
    }, function () {
      $("#mi-copyhint").textContent = "Couldn't copy automatically; use Download instead and paste from the file.";
    });
  });
  $("#mi-export").addEventListener("click", function () {
    var blob = new Blob([summaryText()], { type: "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "deposit-shield-movein-record.txt";
    a.click();
  });

  /* ---------- clause reader ---------- */
  var RULES = [
    { name: "Painting", re: /paint\w*/i, severity: function (t) {
        var m = t.match(/.{0,160}paint\w*.{0,220}/i) || [""];
        var ctx = m[0];
        if (/invoice|bill|tax/i.test(ctx)) return ["ok", "Painting is tied to invoices here. Good \u2014 keep a copy of the invoices demand clause for the deduction fight."];
        if (/pro[- ]?rata|wear and tear|deprecat/i.test(ctx)) return ["ok", "Painting is pro-rata or wear-and-tear limited. Strong protection."];
        return ["bad", "A bare painting clause with no invoice requirement and no wear-and-tear limit is the most abused clause in Bengaluru ('one month's rent for painting' is normalized, not lawful). Negotiate before signing: painting payable only against tax invoices, pro-rata by tenancy length, or waived after 24 months."];
      } },
    { name: "Deposit refund timeline", re: /deposit[\s\S]{0,120}(refund|return|release)|(refund|return)[\s\S]{0,80}deposit/i, severity: function (t) {
        var m = t.match(/.{0,80}(refund|return|release).{0,160}/i) || [""];
        var ctx = m[0];
        if (/after (the )?inspection|satisfactory|as per (the )?landlord|sole discretion/i.test(ctx)) return ["bad", "Refund 'after inspection / landlord's discretion' is an open cheque for deductions. Demand a date: refund on handover, or a fixed number of days."];
        if (/\b\d{1,3}\s*(days?|working days)\b/i.test(ctx)) return ["warn", "A day-count exists. Check it's short (15 days or less is reasonable) and runs from handover, not from the landlord's convenience."];
        return ["warn", "No explicit refund timeline found for the deposit. Add one: refunded within 15 days of handover, less lawful itemized deductions."];
      } },
    { name: "Lock-in", re: /lock[- ]?in/i, severity: function () {
        return ["warn", "Lock-in found. It is contractual, not statutory: if you leave early the deposit can be adjusted against the remaining lock-in months. Negotiate the length, or a buy-out of one month's rent instead."];
      } },
    { name: "Notice period", re: /notice period/i, severity: function (t) {
        var ctx = (t.match(/.{0,60}notice period.{0,120}/i) || [""])[0];
        if (/\b(1|one)\s*month/i.test(ctx)) return ["warn", "One-month notice period. Standard, but check the forfeiture if you can't serve it."];
        return ["warn", "Notice period present. Confirm the exact length and whether short notice forfeits a full month."];
      } },
    { name: "Rent escalation", re: /escalat\w*|increase.{0,40}rent|rent.{0,40}increase/i, severity: function (t) {
        var ctx = (t.match(/.{0,80}(escalat\w*|increase.{0,40}rent|rent.{0,40}increase).{0,120}/i) || [""])[0];
        if (/10\s*%|ten percent/i.test(ctx)) return ["bad", "A 10% annual hike is above market. One tenant's landlord imposed 10% against a 5% agreement clause; don't let the clause allow it. Negotiate 5%."];
        if (/5\s*%|five percent/i.test(ctx)) return ["ok", "5% escalation is fair for Bengaluru."];
        return ["warn", "Escalation mentioned without a cap. Fix a number (5%) or the landlord decides next year."];
      } },
    { name: "Registration", re: /registr|stamp duty|e-stamp/i, severity: function (t) {
        return [/not|required/i.test(t) ? "ok" : "warn", /not|required/i.test(t) ? "Registration is addressed. Confirm the agreement is actually registered, not just notarized." : "No registration clause found. A registered agreement (not a notarized soft copy) changes your legal position entirely if the exit turns hostile."];
      } },
    { name: "Full and final", re: /full[- ]and[- ]final/i, severity: function () {
        return ["warn", "A full-and-final clause exists. Never sign it under pressure at handover; once signed it is the landlord's shield against your challenge."];
      } },
  ];
  $("#reader-go").addEventListener("click", function () {
    var t = $("#reader-input").value;
    var out = "";
    if (t.trim().length < 40) { out = '<div class="flag warn"><span class="chip">NEEDS MORE</span>Paste the full agreement text (at least a few paragraphs) for a useful read.</div>'; }
    else {
      RULES.forEach(function (r) {
        if (r.re.test(t)) {
          var s = r.severity(t);
          var label = s[0] === "bad" ? "PROBLEM" : s[0] === "warn" ? "CHECK" : "OK";
          out += '<div class="flag ' + s[0] + '"><span class="chip">' + label + " \u2014 " + r.name + "</span>" + s[1] + "</div>";
        }
      });
      if (!out) out = '<div class="flag ok"><span class="chip">OK</span>None of the known risky clause patterns matched. Read the deposit and painting lines yourself anyway; this reader catches the common traps, not every drafting trick.</div>';
    }
    $("#reader-out").innerHTML = out;
  });

  /* ---------- deduction challenger ---------- */
  var CATS = ["Painting", "Cleaning", "Repairs", "Renovation", "Rent due", "Utilities", "Society dues", "Other"];
  var rows = [];
  function addRow() {
    rows.push({ item: "", amount: "", invoice: false, cat: "Other" });
    renderRows();
  }
  function renderRows() {
    var html = "";
    rows.forEach(function (r, i) {
      html += '<div class="row">' +
        '<span class="cell">Item<input data-f="item" data-i="' + i + '" value="' + (r.item || "").replace(/"/g, "&quot;") + '" placeholder="e.g. Painting"></span>' +
        '<span class="cell">Amount \u20B9<input data-f="amount" data-i="' + i + '" type="number" min="0" value="' + (r.amount || "") + '"></span>' +
        '<span class="cell">Category<select data-f="cat" data-i="' + i + '">' +
          CATS.map(function (c) { return '<option' + (c === r.cat ? " selected" : "") + ">" + c + "</option>"; }).join("") +
        '</select></span>' +
        '<span class="cell">Invoice?<input type="checkbox" data-f="invoice" data-i="' + i + '"' + (r.invoice ? " checked" : "") + '></span>' +
        '<button type="button" data-del="' + i + '" title="Remove line">\u2715</button></div>';
    });
    $("#ch-rows").innerHTML = html;
  }
  $("#ch-add").addEventListener("click", addRow);
  addRow();
  $("#ch-rows").addEventListener("input", function (e) {
    var f = e.target.dataset.f, i = Number(e.target.dataset.i);
    if (!f || isNaN(i)) return;
    rows[i][f] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
  });
  $("#ch-rows").addEventListener("change", function (e) {
    var f = e.target.dataset.f, i = Number(e.target.dataset.i);
    if (f === "invoice") rows[i][f] = e.target.checked;
  });
  $("#ch-rows").addEventListener("click", function (e) {
    var d = e.target.dataset.del;
    if (d !== undefined) { rows.splice(Number(d), 1); renderRows(); }
  });

  function analyse() {
    var findings = [], disputed = 0, clean = 0;
    rows.forEach(function (r) {
      var amt = Number(r.amount) || 0;
      var name = (r.item || r.cat).toLowerCase();
      var wearTear = /wear|tear|fade|scuff|ageing|aging|fading|nail hole/i.test(name + " " + (r.item || ""));
      var noInvoiceCat = ["painting", "cleaning"].indexOf(r.cat) > -1;
      if (wearTear) {
        findings.push(["bad", r.item || r.cat + " " + fmt(amt), "Bills normal wear and tear. Under tenancy law a landlord may recover for damage you caused, not for ordinary deterioration no matter how carefully you lived there. Dispute it.", amt]);
        disputed += amt;
      } else if (noInvoiceCat && !r.invoice) {
        findings.push(["bad", r.item || r.cat + " " + fmt(amt), "No invoice attached. Painting and cleaning deductions without tax invoices are not enforceable; demand the actual bills or strike the line.", amt]);
        disputed += amt;
      } else if (!r.invoice && r.cat !== "Rent due" && r.cat !== "Utilities" && r.cat !== "Society dues" && amt > 0) {
        findings.push(["warn", r.item || r.cat + " " + fmt(amt), "No invoice on file. Ask for the contractor's bill or a written quote before accepting this line.", amt]);
        disputed += amt;
      } else if (amt > 0) {
        findings.push(["ok", r.item || r.cat + " " + fmt(amt), "Invoice present and category is a lawful head (unpaid rent, utilities, dues, documented damage). Accept only if the amount matches the bill.", 0]);
        clean += amt;
      }
    });
    var html = "";
    findings.forEach(function (f) {
      var label = f[0] === "bad" ? "DISPUTE" : f[0] === "warn" ? "DEMAND INVOICE" : "ACCEPTABLE";
      html += '<div class="flag ' + f[0] + '"><span class="chip">' + label + "</span><strong>" + f[1] + "</strong><br>" + f[2] + "</div>";
    });
    var dep = Number($("#ch-deposit").value) || 0;
    var ref = Number($("#ch-refunded").value) || 0;
    html += '<div class="totals">Disputed: <b>' + fmt(disputed) + "</b> \u00B7 Accepted: <b>" + fmt(clean) +
      "</b><br>Deposit " + fmt(dep) + " \u2212 refunded " + fmt(ref) + " = held: <b>" + fmt(dep - ref) +
      "</b>. Reasonable ask: refund of <b>" + fmt(Math.max(0, dep - ref - clean)) + "</b>.</div>";
    $("#ch-out").innerHTML = html;
    return { disputed: disputed, clean: clean };
  }
  $("#ch-analyse").addEventListener("click", analyse);

  $("#ch-letter").addEventListener("click", function () {
    var res = analyse();
    var d = new Date();
    var deadline = new Date(d.getTime() + 15 * 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    var today = d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    var dep = Number($("#ch-deposit").value) || 0, ref = Number($("#ch-refunded").value) || 0;
    var ask = Math.max(0, dep - ref - res.clean);
    var lines = rows.map(function (r) {
      var amt = Number(r.amount) || 0;
      var bad = /wear|tear|fade|scuff/i.test((r.item || "") + " " + r.cat) || (["Painting", "Cleaning"].indexOf(r.cat) > -1 && !r.invoice);
      return (bad ? "DISPUTED: " : "accepted if invoice matches: ") + (r.item || r.cat) + " \u2014 " + fmt(amt);
    }).join("\n  ") || "(no lines entered)";
    var letter =
"Date: " + today + "\n" +
"To: " + ($("#ch-landlord").value || "[Landlord name]") + "\n" +
"Subject: Demand for refund of security deposit \u2014 " + ($("#ch-address").value || "[property address]") + "\n\n" +
"Dear Sir/Madam,\n\n" +
"I, " + ($("#ch-tenant").value || "[Your name]") + ", was a tenant at the above property and handed over vacant possession" +
($("#ch-vacate").value ? " on " + new Date($("#ch-vacate").value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : " on [date]") + ".\n\n" +
"Of the security deposit of " + fmt(dep) + ", only " + fmt(ref) + " has been returned, leaving " + fmt(dep - ref) + " withheld. Against the deductions communicated, I accept only those supported by tax invoices for damage beyond normal wear and tear. My position, line by line:\n\n  " + lines + "\n\n" +
"Painting and cleaning of a residential premises are ordinary outcomes of living there, not recoverable damages, and in any event only against actual tax invoices. I refer you to the position under tenancy law that a landlord may recover only for damage beyond reasonable wear and tear, supported by documentation.\n\n" +
"I therefore demand payment of " + fmt(ask) + " by bank transfer within 15 (fifteen) days, i.e. by " + deadline + ". Failing which I will pursue recovery through the appropriate forum, including a civil suit for recovery of the amount with interest and costs, without further reference to you.\n\n" +
"This letter is without prejudice to all my rights and remedies.\n\n" +
"Yours faithfully,\n" + ($("#ch-tenant").value || "[Your name]") + "\n[Address for service]\n\n" +
"Prepared with Deposit Shield. Documents and drafts only \u2014 not legal advice. Review with a lawyer before sending if the amount is significant.";
    var html = '<div class="flag warn"><span class="chip">DEMAND LETTER</span>Send by WhatsApp <em>and</em> email (or registered post) so there is proof of service. A written demand naming the next forum, with a 15-day deadline, settles most disputes before filing.</div>' +
      '<pre class="letter" id="ch-lettertext"></pre>' +
      '<div class="actions"><button class="btn primary" id="ch-copyletter">Copy letter</button><button class="btn" id="ch-dlletter">Download .txt</button></div>';
    $("#ch-out").insertAdjacentHTML("beforeend", html);
    $("#ch-lettertext").textContent = letter;
    $("#ch-copyletter").addEventListener("click", function () {
      navigator.clipboard.writeText(letter);
      $("#ch-copyletter").textContent = "Copied";
    });
    $("#ch-dlletter").addEventListener("click", function () {
      var blob = new Blob([letter], { type: "text/plain" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "deposit-demand-letter.txt";
      a.click();
    });
    $("#ch-lettertext").scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
