(function () {
  "use strict";

  /* Tema claro/oscuro: clase html.dark (mismo contrato que PrimeNG darkModeSelector: '.dark'). */
  var THEME_STORAGE_KEY = "supplynet-theme";
  var themeRoot = document.documentElement;
  var themeToggle = document.getElementById("theme-toggle");

  function themeIsDark() {
    return themeRoot.classList.contains("dark");
  }

  function themeApply(dark) {
    themeRoot.classList.toggle("dark", !!dark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch (e) {}
    themeSyncToggle();
  }

  function themeSyncToggle() {
    if (!themeToggle) return;
    var dark = themeIsDark();
    themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
    themeToggle.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode"
    );
    themeToggle.setAttribute(
      "title",
      dark ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      themeApply(!themeIsDark());
    });
  }
  themeSyncToggle();
})();

(function () {
  "use strict";

  var STORAGE_KEY = "supplynet-sidebar-collapsed";
  /* Drawer + hamburguesa solo bajo este ancho (sidebar en flujo desde 640px) */
  var DRAWER_MQ = window.matchMedia("(max-width: 639px)");

  var frame = document.getElementById("app-frame");
  var sidebar = document.getElementById("sidebar");
  var backdrop = document.getElementById("sidebar-backdrop");
  var toggle = document.getElementById("sidebar-toggle");
  var toggleMobile = document.getElementById("sidebar-toggle-mobile");
  var menuWrap = document.querySelector(".topbar__menu-wrap");
  var menuPanel = document.getElementById("mobile-nav-panel");

  if (!frame || !sidebar || !toggle) return;

  frame.classList.add("frame--sidebar-static");

  function endSidebarStatic() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        frame.classList.remove("frame--sidebar-static");
      });
    });
  }

  function isDrawerMode() {
    return DRAWER_MQ.matches;
  }

  function getLabels() {
    return sidebar.querySelectorAll(".nav-item__label");
  }

  function setLabelVisibility(collapsed) {
    getLabels().forEach(function (el) {
      if (collapsed && !isDrawerMode()) {
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("aria-hidden");
      }
    });
  }

  function applyDesktopCollapsed(collapsed) {
    if (collapsed) {
      frame.classList.add("frame--sidebar-collapsed");
    } else {
      frame.classList.remove("frame--sidebar-collapsed");
    }
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute(
      "aria-label",
      collapsed ? "Expand sidebar" : "Collapse sidebar"
    );
    setLabelVisibility(collapsed);
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch (e) {}
  }

  function syncMobileMenuAria(expanded) {
    if (toggleMobile) {
      toggleMobile.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggleMobile.setAttribute(
        "aria-label",
        expanded ? "Close navigation menu" : "Open navigation menu"
      );
    }
  }

  function isMenuPanelOpen() {
    return menuPanel && !menuPanel.hidden;
  }

  function openMobileNavPanel() {
    if (!menuPanel) return;
    if (typeof window.__supplynetCloseNotificationPanel === "function") {
      window.__supplynetCloseNotificationPanel();
    }
    menuPanel.hidden = false;
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () {
      backdrop.classList.add("sidebar-backdrop--visible");
    });
    syncMobileMenuAria(true);
    document.body.classList.add("drawer-open");
  }

  function closeMobileNavPanel() {
    if (!menuPanel) return;
    menuPanel.hidden = true;
    backdrop.classList.remove("sidebar-backdrop--visible");
    document.body.classList.remove("drawer-open");
    syncMobileMenuAria(false);
    window.setTimeout(function () {
      if (!isMenuPanelOpen()) {
        backdrop.hidden = true;
        backdrop.setAttribute("aria-hidden", "true");
      }
    }, 220);
  }

  function syncFromStorage() {
    if (isDrawerMode()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        applyDesktopCollapsed(true);
      }
    } catch (e) {}
  }

  function onResize() {
    if (!isDrawerMode()) {
      closeMobileNavPanel();
      backdrop.hidden = true;
      backdrop.classList.remove("sidebar-backdrop--visible");
      backdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("drawer-open");
      syncFromStorage();
      setLabelVisibility(frame.classList.contains("frame--sidebar-collapsed"));
    } else {
      frame.classList.remove("frame--sidebar-collapsed");
      closeMobileNavPanel();
      setLabelVisibility(false);
      syncMobileMenuAria(false);
    }
  }

  function onSidebarToggleClick() {
    if (isDrawerMode()) {
      if (isMenuPanelOpen()) {
        closeMobileNavPanel();
      } else {
        openMobileNavPanel();
      }
    } else {
      var next = !frame.classList.contains("frame--sidebar-collapsed");
      applyDesktopCollapsed(next);
    }
  }

  toggle.addEventListener("click", onSidebarToggleClick);
  if (toggleMobile) {
    toggleMobile.addEventListener("click", function (e) {
      e.stopPropagation();
      onSidebarToggleClick();
    });
  }

  if (menuWrap) {
    menuWrap.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  backdrop.addEventListener("click", function () {
    if (isDrawerMode()) closeMobileNavPanel();
  });

  document.addEventListener("click", function (e) {
    if (!isDrawerMode() || !menuPanel || menuPanel.hidden) return;
    if (menuWrap && !menuWrap.contains(e.target)) {
      closeMobileNavPanel();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isDrawerMode() && isMenuPanelOpen()) {
      closeMobileNavPanel();
      if (toggleMobile) toggleMobile.focus();
      else toggle.focus();
    }
  });

  if (menuPanel) {
    menuPanel.addEventListener("click", function (e) {
      if (e.target.closest(".mobile-nav-panel__link")) {
        closeMobileNavPanel();
      }
    });
  }

  DRAWER_MQ.addEventListener("change", onResize);
  window.addEventListener("resize", onResize);

  if (isDrawerMode()) {
    syncMobileMenuAria(false);
    getLabels().forEach(function (el) {
      el.removeAttribute("aria-hidden");
    });
  } else {
    syncFromStorage();
    setLabelVisibility(frame.classList.contains("frame--sidebar-collapsed"));
  }

  window.__supplynetCloseMobileNavPanel = closeMobileNavPanel;

  endSidebarStatic();
})();

(function () {
  "use strict";

  var NOTIF_AFTER_WELCOME_MS = 1500;
  var BELL_RING_AFTER_BADGE_MS = 500;
  var wrap = document.querySelector(".topbar__notif-wrap");
  var btn = document.getElementById("notif-toggle");
  var badge = document.getElementById("notif-badge");
  var panel = document.getElementById("notif-panel");
  var list = document.getElementById("notif-tabpanel");
  var btnDismissAll = document.getElementById("notif-action-dismiss-all");
  var tabAll = document.getElementById("notif-tab-all");
  var tabUnread = document.getElementById("notif-tab-unread");
  var tabUnreadBadge = document.getElementById("notif-unread-tab-count");
  var detail = document.getElementById("notif-detail");
  var detailTitle = document.getElementById("notif-detail-title");
  var detailMeta = document.getElementById("notif-detail-meta");
  var detailText = document.getElementById("notif-detail-text");
  var btnDetailBack = document.getElementById("notif-detail-back");
  var detailActions = document.getElementById("notif-detail-actions");
  var detailCta = document.getElementById("notif-detail-cta");
  var detailCtaLabelText = document.getElementById("notif-detail-cta-label");

  if (!wrap || !btn || !badge || !panel || !list || !btnDismissAll) return;
  if (!tabAll || !tabUnread || !tabUnreadBadge) return;
  if (
    !detail ||
    !detailTitle ||
    !detailMeta ||
    !detailText ||
    !btnDetailBack ||
    !detailActions ||
    !detailCta ||
    !detailCtaLabelText
  )
    return;

  var NOTIF_DETAILS = {
    appointment: {
      title: "New appointment request",
      meta: "María Elena Ríos · Warehouse North · 5 minutes ago",
      html:
        "<p>María Elena Ríos requested a pickup slot on <strong>Thursday, April 16</strong>, 09:00–11:00.</p><p>Reference <strong>PO-8821</strong>. Confirm or propose another window in TMS.</p>",
      goLabel: "Go to calendar",
      goIcon: "pi-calendar",
      goScreen: "calendar",
    },
    "shipment-tms": {
      title: "Approval required — TMS-1082",
      meta: "Dispatch · 1 hour ago",
      html:
        "<p>Shipment <strong>TMS-1082</strong> is blocked until you approve the route and carrier assignment.</p><p>Review costs and ETA, then approve or reject in the shipment workflow.</p>",
      goLabel: "Go to shipments & approvals",
      goIcon: "pi-truck",
      goScreen: "shipments-approval",
    },
    "comment-load": {
      title: "Comment on load #4401",
      meta: "John Smith · Yesterday",
      html:
        "<p><strong>John Smith</strong> commented on load <strong>#4401</strong>:</p><p>“Please confirm the revised delivery window with the consignee before we reschedule the truck.”</p>",
      goLabel: "Go to load #4401",
      goIcon: "pi-map-marker",
      goScreen: "load-detail",
    },
  };

  var notificationPending = false;
  var unreadCount = 0;
  var bellRingCanceled = false;
  var bellRingDelayId = null;
  var filterUnreadActive = false;

  function countVisibleNotifications() {
    return list.querySelectorAll(".notif-panel__row:not([hidden])").length;
  }

  function countUnread() {
    return list.querySelectorAll(
      '.notif-panel__row:not([hidden])[data-unread="true"]'
    ).length;
  }

  function updateTabBadge() {
    var n = countUnread();
    if (n < 1) {
      tabUnreadBadge.textContent = "0";
      tabUnreadBadge.hidden = true;
      tabUnreadBadge.setAttribute("aria-hidden", "true");
    } else {
      tabUnreadBadge.textContent = badgeDisplayText(n);
      tabUnreadBadge.hidden = false;
      tabUnreadBadge.setAttribute("aria-hidden", "true");
    }
  }

  function applyFilter() {
    if (filterUnreadActive) {
      panel.classList.add("notif-panel--filter-unread");
    } else {
      panel.classList.remove("notif-panel--filter-unread");
    }
  }

  function selectFilterTab(unreadOnly) {
    closeNotifDetail();
    filterUnreadActive = unreadOnly;
    tabAll.setAttribute("aria-selected", unreadOnly ? "false" : "true");
    tabUnread.setAttribute("aria-selected", unreadOnly ? "true" : "false");
    tabAll.classList.toggle("notif-panel__tab--active", !unreadOnly);
    tabUnread.classList.toggle("notif-panel__tab--active", unreadOnly);
    list.setAttribute("aria-labelledby", unreadOnly ? "notif-tab-unread" : "notif-tab-all");
    applyFilter();
  }

  function syncNotificationState() {
    var visible = countVisibleNotifications();
    if (visible < 1) {
      clearNotification();
      return;
    }
    unreadCount = countUnread();
    if (unreadCount > 0) {
      badge.textContent = badgeDisplayText(unreadCount);
      badge.hidden = false;
      badge.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-label", notifButtonAriaLabel(unreadCount));
    } else {
      badge.textContent = "";
      badge.hidden = true;
      badge.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-label", "Notifications");
    }
    updateTabBadge();
  }

  function badgeDisplayText(n) {
    return n > 9 ? "9+" : String(n);
  }

  function notifButtonAriaLabel(n) {
    if (n === 1) return "Notifications, 1 unread";
    return "Notifications, " + n + " unread";
  }

  function showBadge() {
    var visible = countVisibleNotifications();
    if (visible < 1) return;
    notificationPending = true;
    bellRingCanceled = false;
    unreadCount = countUnread();
    syncNotificationState();

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || unreadCount < 1) return;

    if (bellRingDelayId !== null) {
      window.clearTimeout(bellRingDelayId);
      bellRingDelayId = null;
    }
    bellRingDelayId = window.setTimeout(function () {
      bellRingDelayId = null;
      if (bellRingCanceled || !notificationPending || countUnread() < 1) return;
      var bellImg = btn.querySelector("img");
      if (!bellImg) return;
      btn.classList.add("notif-toggle--pulse");
      bellImg.addEventListener(
        "animationend",
        function onBellRingEnd(e) {
          if (e.animationName !== "notif-bell-ring") return;
          btn.classList.remove("notif-toggle--pulse");
        },
        { once: true }
      );
    }, BELL_RING_AFTER_BADGE_MS);
  }

  function closeNotifDetail() {
    detail.hidden = true;
    panel.classList.remove("notif-panel--detail");
    list.removeAttribute("aria-hidden");
  }

  function markRowRead(row) {
    if (!row || row.getAttribute("data-unread") !== "true") return;
    row.setAttribute("data-unread", "false");
    row.classList.remove("notif-panel__row--unread");
    row.classList.add("notif-panel__row--read");
    syncNotificationState();
  }

  function openNotifDetail(row) {
    var key = row && row.getAttribute("data-notif-key");
    var d = key && NOTIF_DETAILS[key];
    if (!d) return;
    detailTitle.textContent = d.title;
    detailMeta.textContent = d.meta;
    detailText.innerHTML = d.html;
    var iconEl = detailCta.querySelector(".notif-panel__detail-cta-icon i");
    if (iconEl && d.goIcon) iconEl.className = "pi " + d.goIcon;
    detailCtaLabelText.textContent = d.goLabel || "";
    detailCta.setAttribute("data-go-screen", d.goScreen || "");
    detailCta.setAttribute(
      "aria-label",
      d.goLabel ? d.goLabel + " (prototype, no navigation)" : "Open related screen"
    );
    detailActions.hidden = !d.goLabel;
    detail.hidden = false;
    panel.classList.add("notif-panel--detail");
    list.setAttribute("aria-hidden", "true");
    markRowRead(row);
  }

  function syncNotifPanelFixedTop() {
    var topbar = document.querySelector(".app-shell > .topbar");
    if (!topbar) return;
    if (window.matchMedia("(max-width: 767px)").matches && !panel.hidden) {
      var br = topbar.getBoundingClientRect();
      panel.style.setProperty(
        "--notif-panel-top",
        Math.round(br.bottom + 10) + "px"
      );
    } else {
      panel.style.removeProperty("--notif-panel-top");
    }
  }

  function openPanel() {
    if (typeof window.__supplynetCloseMobileNavPanel === "function") {
      window.__supplynetCloseMobileNavPanel();
    }
    panel.hidden = false;
    panel.style.removeProperty("display");
    btn.setAttribute("aria-expanded", "true");
    syncNotifPanelFixedTop();
  }

  function closePanel() {
    closeNotifDetail();
    panel.hidden = true;
    panel.style.setProperty("display", "none", "important");
    btn.setAttribute("aria-expanded", "false");
    panel.style.removeProperty("--notif-panel-top");
  }

  function clearNotification() {
    bellRingCanceled = true;
    if (bellRingDelayId !== null) {
      window.clearTimeout(bellRingDelayId);
      bellRingDelayId = null;
    }
    notificationPending = false;
    unreadCount = 0;
    filterUnreadActive = false;
    panel.classList.remove("notif-panel--filter-unread");
    tabAll.setAttribute("aria-selected", "true");
    tabUnread.setAttribute("aria-selected", "false");
    tabAll.classList.add("notif-panel__tab--active");
    tabUnread.classList.remove("notif-panel__tab--active");
    list.setAttribute("aria-labelledby", "notif-tab-all");
    tabUnreadBadge.textContent = "0";
    tabUnreadBadge.hidden = true;
    tabUnreadBadge.setAttribute("aria-hidden", "true");
    closePanel();
    list.querySelectorAll(".notif-panel__row").forEach(function (row) {
      row.hidden = true;
    });
    badge.textContent = "";
    badge.hidden = true;
    badge.setAttribute("aria-hidden", "true");
    btn.classList.remove("notif-toggle--pulse");
    btn.setAttribute("aria-label", "Notifications");
  }

  window.addEventListener(
    "supplynet:welcome-complete",
    function () {
      window.setTimeout(showBadge, NOTIF_AFTER_WELCOME_MS);
    },
    { once: true }
  );

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!notificationPending) return;
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  window.addEventListener("resize", syncNotifPanelFixedTop);

  document.addEventListener("click", function (e) {
    if (!panel.hidden && !wrap.contains(e.target)) {
      closePanel();
    }
  });

  panel.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || panel.hidden) return;
    if (panel.classList.contains("notif-panel--detail")) {
      closeNotifDetail();
      return;
    }
    closePanel();
    btn.focus();
  });

  tabAll.addEventListener("click", function () {
    selectFilterTab(false);
  });

  tabUnread.addEventListener("click", function () {
    selectFilterTab(true);
  });

  list.addEventListener("click", function (e) {
    var item = e.target.closest(".notif-panel__item");
    if (!item) return;
    var row = item.closest(".notif-panel__row");
    if (!row || row.hidden) return;
    openNotifDetail(row);
  });

  btnDetailBack.addEventListener("click", function () {
    closeNotifDetail();
    btnDetailBack.focus();
  });

  detailCta.addEventListener("click", function () {
    var screen = detailCta.getAttribute("data-go-screen") || "";
    if (screen && typeof console !== "undefined" && console.log) {
      console.log("[Supplynet prototype] Simulated navigation:", screen);
    }
  });

  btnDismissAll.addEventListener("click", function (e) {
    e.stopPropagation();
    if (panel.classList.contains("notif-panel--detail")) return;
    clearNotification();
  });

  closePanel();

  window.__supplynetCloseNotificationPanel = closePanel;
})();

/* Degradado del shell + título: load → fuentes → idle → pausa → fade (--shell-lazy-fade) */
(function () {
  "use strict";

  var shell = document.querySelector(".app-shell");
  var welcome = document.querySelector(".welcome");
  var lazyBg = shell && shell.querySelector(".app-shell__lazy-bg");
  if (!shell || !welcome) return;

  var pauseMs = 274;
  var idleMaxMs = 2016;
  var fadeRaw = getComputedStyle(document.documentElement)
    .getPropertyValue("--shell-lazy-fade")
    .trim();
  var gradientMs = Math.round(parseFloat(fadeRaw) * 1000) || 745;

  function notifyWelcomeComplete() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var root = document.documentElement;
    var opMs =
      Math.round(
        parseFloat(
          getComputedStyle(root).getPropertyValue("--welcome-title-opacity-dur").trim()
        ) * 1000
      ) || 720;
    var trMs =
      Math.round(
        parseFloat(
          getComputedStyle(root).getPropertyValue("--welcome-title-transform-dur").trim()
        ) * 1000
      ) || 756;
    var opRedMs =
      Math.round(
        parseFloat(
          getComputedStyle(root)
            .getPropertyValue("--welcome-title-opacity-dur-reduced")
            .trim()
        ) * 1000
      ) || 324;
    var fallbackMs = reduce ? opRedMs + 80 : Math.max(opMs, trMs) + 100;

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      welcome.removeEventListener("transitionend", onTe);
      window.dispatchEvent(new CustomEvent("supplynet:welcome-complete"));
    }
    var gotOpacity = false;
    var gotTransform = false;
    function onTe(e) {
      if (e.target !== welcome) return;
      if (e.propertyName === "opacity") gotOpacity = true;
      if (e.propertyName === "transform") gotTransform = true;
      if (reduce && gotOpacity) finish();
      if (!reduce && gotOpacity && gotTransform) finish();
    }
    welcome.addEventListener("transitionend", onTe);
    window.setTimeout(finish, fallbackMs);
  }

  function showTitle() {
    welcome.classList.remove("welcome--pending");
    welcome.classList.add("welcome--visible");
    welcome.setAttribute("aria-busy", "false");
    notifyWelcomeComplete();
  }

  function runGradientThenTitle() {
    shell.classList.add("app-shell--welcome-loaded");
    if (!lazyBg) {
      window.setTimeout(showTitle, gradientMs);
      return;
    }
    var done = false;
    function next() {
      if (done) return;
      done = true;
      lazyBg.removeEventListener("transitionend", onEnd);
      showTitle();
    }
    function onEnd(e) {
      if (e.target === lazyBg && e.propertyName === "opacity") next();
    }
    lazyBg.addEventListener("transitionend", onEnd);
    window.setTimeout(next, gradientMs + 52);
  }

  function afterIdle() {
    window.setTimeout(runGradientThenTitle, pauseMs);
  }

  window.addEventListener(
    "load",
    function () {
      function queueIdle(fn) {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(fn, { timeout: idleMaxMs });
        } else {
          window.setTimeout(fn, 288);
        }
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          queueIdle(afterIdle);
        });
      } else {
        queueIdle(afterIdle);
      }
    },
    { once: true }
  );
})();
