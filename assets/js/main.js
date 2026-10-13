

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n) {
    return (n < 10 ? "0" : "") + n;
  };

  var normalize = function (p) {
    return p.replace(/index\.html$/, "").replace(/\/$/, "");
  };
  var here = normalize(window.location.pathname);

  document
    .querySelectorAll(".gnav a, .mobile-nav a, .site-footer__nav a")
    .forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.charAt(0) === "#" || href.indexOf("tel:") === 0) return;
      if (a.origin !== window.location.origin) return;
      if (normalize(a.pathname) !== here) return;
      a.setAttribute("aria-current", "page");
      var sub = a.closest(".gnav__item--has-sub");
      if (sub) {
        var parent = sub.querySelector(".gnav__toggle");
        if (parent) parent.classList.add("is-current");
      }
    });

  var header = document.querySelector("[data-header]");
  var toggles = Array.prototype.slice.call(document.querySelectorAll(".gnav__toggle"));

  var closeSubs = function (except) {
    toggles.forEach(function (t) {
      if (t !== except) t.setAttribute("aria-expanded", "false");
    });
  };

  if (header) {
    var lastY = window.scrollY;
    var ticking = false;

    var updateHeader = function () {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 40);

      var menuOpen = header.classList.contains("is-menu-open");
      var subOpen = toggles.some(function (t) {
        return t.getAttribute("aria-expanded") === "true";
      });
      var focusInside = header.contains(document.activeElement) && document.activeElement !== document.body;
      var threshold = window.innerHeight * 0.6;

      if (menuOpen || subOpen || focusInside || y <= threshold) {
        header.classList.remove("is-hidden");
      } else if (y > lastY + 4) {
        header.classList.add("is-hidden");
      } else if (y < lastY - 4) {
        header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      },
      { passive: true }
    );
    header.addEventListener("focusin", function () {
      header.classList.remove("is-hidden");
    });
    updateHeader();
  }

  toggles.forEach(function (t) {
    var item = t.closest(".gnav__item");
    t.addEventListener("click", function () {
      var open = t.getAttribute("aria-expanded") === "true";
      closeSubs(t);
      t.setAttribute("aria-expanded", open ? "false" : "true");
    });
    if (item) {
      item.addEventListener("focusout", function (e) {
        if (!item.contains(e.relatedTarget)) t.setAttribute("aria-expanded", "false");
      });
      item.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && t.getAttribute("aria-expanded") === "true") {
          t.setAttribute("aria-expanded", "false");
          t.focus();
        }
      });
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".gnav__item--has-sub")) closeSubs();
  });

  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  if (header && navToggle && mobileNav) {
    var openNav = function () {
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "メニューを閉じる");
      header.classList.add("is-menu-open");
      header.classList.remove("is-hidden");
      mobileNav.hidden = false;
      mobileNav.classList.add("is-open");
      document.documentElement.style.overflow = "hidden";
    };

    var closeNav = function (returnFocus) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "メニューを開く");
      header.classList.remove("is-menu-open");
      mobileNav.hidden = true;
      mobileNav.classList.remove("is-open");
      document.documentElement.style.overflow = "";
      if (returnFocus) navToggle.focus();
    };

    navToggle.addEventListener("click", function () {
      if (navToggle.getAttribute("aria-expanded") === "true") closeNav(false);
      else openNav();
    });

    document.addEventListener("keydown", function (e) {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      if (e.key === "Escape") {
        closeNav(true);
        return;
      }

      if (e.key === "Tab") {
        var focusables = [navToggle].concat(
          Array.prototype.slice.call(mobileNav.querySelectorAll("a[href], button:not([disabled])"))
        );
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    mobileNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });

    window.matchMedia("(min-width: 1280px)").addEventListener("change", function (mq) {
      if (mq.matches && navToggle.getAttribute("aria-expanded") === "true") closeNav(false);
    });
  }

  var mv = document.querySelector("[data-mv]");

  if (mv) {
    var slides = Array.prototype.slice.call(mv.querySelectorAll(".mv__slide"));
    var index = Math.max(0, slides.findIndex(function (s) {
      return s.classList.contains("is-current");
    }));
    var timer = null;

    var show = function (i) {
      var prev = slides[index];
      prev.classList.remove("is-current");
      prev.classList.add("is-leaving");
      window.setTimeout(function () {
        prev.classList.remove("is-leaving");
      }, 2000);
      index = (i + slides.length) % slides.length;
      slides[index].classList.add("is-current");
    };

    var stop = function () {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    var start = function () {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 7000);
    };

    if (slides.length > 1 && !reduceMotion) {

      slides.forEach(function (s) {
        var img = s.querySelector("img");
        if (!img) return;
        img.loading = "eager";
        if (img.decode) img.decode().catch(function () {});
      });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop();
        else start();
      });
      start();
    }
  }

  var reveals = document.querySelectorAll("[data-reveal]");

  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.01 }
      );
      reveals.forEach(function (el) {
        el.setAttribute("data-reveal-ready", "");
        io.observe(el);
      });
    }
  }

  var strengths = document.querySelector("[data-strengths]");

  if (strengths) {
    var items = Array.prototype.slice.call(strengths.querySelectorAll("[data-strength]"));
    var track = strengths.querySelector(".strengths__track");
    var thumbsWrap = strengths.querySelector("[data-strengths-thumbs]");

    if (items.length > 1 && track && thumbsWrap) {
      var active = -1;
      var buttons = [];

      var setActive = function (i) {
        if (i === active) return;
        active = i;
        items.forEach(function (item, k) {
          item.classList.toggle("is-active", k === i);
        });
        buttons.forEach(function (b, k) {
          b.setAttribute("aria-current", k === i ? "true" : "false");
        });
      };

      var scrollToIndex = function (i) {
        var rect = track.getBoundingClientRect();
        var distance = rect.height - window.innerHeight;
        var top = window.scrollY + rect.top + distance * ((i + 0.5) / items.length);
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      };

      items.forEach(function (item, i) {
        var bg = item.querySelector(".strength__bg img");
        var title = item.querySelector(".strength__title");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "strengths__thumb";
        btn.setAttribute("aria-label", pad(i + 1) + " " + (title ? title.textContent.trim() : "") + "を表示");
        if (bg) {
          var thumb = document.createElement("img");
          thumb.src = bg.currentSrc || bg.src;
          thumb.alt = "";
          thumb.loading = "lazy";
          btn.appendChild(thumb);
        }
        btn.addEventListener("click", function () {
          scrollToIndex(i);
        });
        thumbsWrap.appendChild(btn);
        buttons.push(btn);
      });

      strengths.classList.add("is-enhanced");

      var bodies = items
        .map(function (item) {
          return item.querySelector(".strength__body");
        })
        .filter(Boolean);
      var setBodyHeight = function () {
        var max = 0;
        bodies.forEach(function (b) {
          max = Math.max(max, b.offsetHeight);
        });
        strengths.style.setProperty("--strength-body-h", max + "px");
      };
      setBodyHeight();
      if ("ResizeObserver" in window) {
        var bodyObserver = new ResizeObserver(setBodyHeight);
        bodies.forEach(function (b) {
          bodyObserver.observe(b);
        });
      } else {
        window.addEventListener("resize", setBodyHeight);
      }

      var stTicking = false;
      var updateStrengths = function () {
        var rect = track.getBoundingClientRect();
        var distance = rect.height - window.innerHeight;
        var progress = distance > 0 ? -rect.top / distance : 0;
        progress = Math.min(Math.max(progress, 0), 0.9999);
        setActive(Math.floor(progress * items.length));
        stTicking = false;
      };

      window.addEventListener(
        "scroll",
        function () {
          if (!stTicking) {
            window.requestAnimationFrame(updateStrengths);
            stTicking = true;
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", updateStrengths);
      updateStrengths();
    }
  }

  var mockPager = document.querySelector("[data-mock-per-page]");
  var mockList = mockPager ? mockPager.previousElementSibling : null;

  if (mockPager && mockList) {
    var perPage = parseInt(mockPager.getAttribute("data-mock-per-page"), 10) || 10;
    var mockEntries = Array.prototype.slice.call(mockList.children);
    var totalPages = Math.max(1, Math.ceil(mockEntries.length / perPage));
    var currentPage = parseInt(new URLSearchParams(window.location.search).get("page"), 10) || 1;
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    var pageFile = window.location.pathname.split("/").pop() || "";
    var pageHref = function (n) {
      return n === 1 ? pageFile : pageFile + "?page=" + n;
    };

    mockEntries.forEach(function (li, i) {
      if (Math.floor(i / perPage) + 1 !== currentPage) li.hidden = true;
    });

    var makePagerItem = function (modifiers, label, href, rel) {
      var li = document.createElement("li");
      li.className = ["soph-pagination__item"]
        .concat(
          modifiers.map(function (m) {
            return "soph-pagination__item--" + m;
          })
        )
        .join(" ");
      var inner = document.createElement(href ? "a" : "span");
      inner.textContent = label;
      if (href) inner.setAttribute("href", href);
      if (rel) inner.setAttribute("rel", rel);
      if (modifiers.indexOf("current") !== -1) inner.setAttribute("aria-current", "page");
      li.appendChild(inner);
      return li;
    };

    var pagerList = mockPager.querySelector(".soph-pagination__list");
    if (pagerList) {
      pagerList.textContent = "";
      pagerList.appendChild(
        currentPage > 1
          ? makePagerItem(["prev"], "« 前へ", pageHref(currentPage - 1), "prev")
          : makePagerItem(["prev", "disabled"], "« 前へ")
      );
      for (var p = 1; p <= totalPages; p++) {
        pagerList.appendChild(
          p === currentPage ? makePagerItem(["current"], String(p)) : makePagerItem([], String(p), pageHref(p))
        );
      }
      pagerList.appendChild(
        currentPage < totalPages
          ? makePagerItem(["next"], "次へ »", pageHref(currentPage + 1), "next")
          : makePagerItem(["next", "disabled"], "次へ »")
      );
    }
  }

  var compactPager = function (nav) {
    var list = nav.querySelector(".soph-pagination__list");
    if (!list) return;

    var pages = Array.prototype.slice.call(list.children).filter(function (li) {
      return !/soph-pagination__item--(prev|next)/.test(li.className) && /^[0-9]+$/.test(li.textContent.trim());
    });
    if (pages.length < 4) return;

    var currentIndex = 0;
    pages.forEach(function (li, i) {
      if (/soph-pagination__item--current/.test(li.className)) currentIndex = i;
    });

    var last = pages.length - 1;
    var shown = {};
    [0, last, currentIndex - 1, currentIndex, currentIndex + 1].forEach(function (i) {
      if (i >= 0 && i <= last) shown[i] = true;
    });

    var gap = false;
    pages.forEach(function (li, i) {
      if (shown[i]) {
        if (gap) {
          var ellipsis = document.createElement("li");
          ellipsis.className = "soph-pagination__item soph-pagination__item--ellipsis";
          var mark = document.createElement("span");
          mark.textContent = "…";
          ellipsis.appendChild(mark);
          list.insertBefore(ellipsis, li);
          gap = false;
        }
        li.hidden = false;
      } else {
        li.hidden = true;
        gap = true;
      }
    });
  };

  Array.prototype.forEach.call(document.querySelectorAll(".soph-pagination"), compactPager);

  var pendingFilter = document.querySelector(".news-filter");

  if (pendingFilter && !pendingFilter.closest(".news-filter-select")) {
    var selectWrap = document.createElement("div");
    selectWrap.className = "news-filter-select";
    if (!pendingFilter.id) pendingFilter.id = "news-filter-panel";

    var builtToggle = document.createElement("button");
    builtToggle.type = "button";
    builtToggle.className = "news-filter-select__toggle";
    builtToggle.setAttribute("aria-expanded", "false");
    builtToggle.setAttribute("aria-controls", pendingFilter.id);

    var builtLabel = document.createElement("span");
    builtLabel.className = "news-filter-select__label";
    builtLabel.setAttribute("data-filter-label", "");

    var builtChev = document.createElement("span");
    builtChev.className = "news-filter-select__chev";
    builtChev.setAttribute("aria-hidden", "true");

    builtToggle.appendChild(builtLabel);
    builtToggle.appendChild(builtChev);
    pendingFilter.parentNode.insertBefore(selectWrap, pendingFilter);
    selectWrap.appendChild(builtToggle);
    selectWrap.appendChild(pendingFilter);
  }

  var filterToggle = document.querySelector(".news-filter-select__toggle");
  var filterLabel = filterToggle ? filterToggle.querySelector("[data-filter-label]") : null;
  var newsFilter = document.querySelector(".news-filter");

  var closeNewsFilter = function () {
    if (filterToggle) filterToggle.setAttribute("aria-expanded", "false");
  };

  if (filterToggle && newsFilter) {
    var syncFilterLabel = function () {
      var current = newsFilter.querySelector(".news-filter__button.active");
      if (filterLabel && current) filterLabel.textContent = current.getAttribute("data-filter");
    };
    syncFilterLabel();

    filterToggle.addEventListener("click", function () {
      var open = filterToggle.getAttribute("aria-expanded") === "true";
      filterToggle.setAttribute("aria-expanded", open ? "false" : "true");
    });

    var filterSelect = filterToggle.closest(".news-filter-select");
    if (filterSelect) {
      filterSelect.addEventListener("focusout", function (e) {
        if (!filterSelect.contains(e.relatedTarget)) closeNewsFilter();
      });
      filterSelect.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && filterToggle.getAttribute("aria-expanded") === "true") {
          closeNewsFilter();
          filterToggle.focus();
        }
      });
    }

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".news-filter-select")) closeNewsFilter();
    });
  }

  var pagetop = document.querySelector("[data-pagetop]");

  if (pagetop) {
    var ptTicking = false;
    var updatePagetop = function () {
      pagetop.classList.toggle("is-visible", window.scrollY > window.innerHeight);
      ptTicking = false;
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!ptTicking) {
          window.requestAnimationFrame(updatePagetop);
          ptTicking = true;
        }
      },
      { passive: true }
    );
    pagetop.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      var brand = document.querySelector(".site-header__brand");
      if (brand) brand.focus({ preventScroll: true });
    });
    updatePagetop();
  }

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxTriggers = Array.prototype.slice.call(
    document.querySelectorAll(".js-lightbox-trigger")
  );

  if (lightbox && lightboxImg && lightboxTriggers.length) {
    var lastTrigger = null;

    var openLightbox = function (trigger) {
      var innerImg = trigger.querySelector("img");
      var src = innerImg && (innerImg.currentSrc || innerImg.src);
      if (!src) return;
      lightboxImg.src = src;
      lightboxImg.alt = (innerImg && innerImg.alt) || "";
      lastTrigger = trigger;
      lightbox.hidden = false;
      document.documentElement.style.overflow = "hidden";
      lightbox.querySelector(".lightbox__close").focus();
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      lightboxImg.src = "";
      document.documentElement.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
      lastTrigger = null;
    };

    lightboxTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        openLightbox(trigger);
      });
    });

    lightbox.querySelector("[data-lightbox-close]").addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") {
        closeLightbox();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        lightbox.querySelector(".lightbox__close").focus();
      }
    });
  }
})();
