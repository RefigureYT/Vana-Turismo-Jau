import { qs } from "../login/login";

type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "vana.theme";
const SIDEBAR_KEY = "vana.sidebar";

function getSystemTheme(): "light" | "dark" {
    const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
}

function readTheme(): ThemeMode {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
    return "system";
}

function applyTheme(mode: ThemeMode) {
    const root = document.documentElement;

    if (mode === "light" || mode === "dark") {
        root.setAttribute("data-theme", mode);
    } else {
        root.removeAttribute("data-theme");
    }

    const effective = mode === "system" ? getSystemTheme() : mode;
    root.setAttribute("data-theme-effective", effective);
    root.style.colorScheme = effective;
}

function setTheme(mode: ThemeMode) {
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
}

function setMenuRadioState(menu: HTMLElement, mode: ThemeMode) {
    const items = menu.querySelectorAll<HTMLElement>("[data-theme]");
    items.forEach((el) => {
        const v = el.dataset.theme as ThemeMode | undefined;
        el.setAttribute("aria-checked", v === mode ? "true" : "false");
    });
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function positionMenu(menu: HTMLElement, anchor: HTMLElement) {
    const r = anchor.getBoundingClientRect();
    const m = menu.getBoundingClientRect();

    const top = clamp(
        r.top + r.height / 2 - m.height / 2,
        10,
        window.innerHeight - m.height - 10
    );
    const left = clamp(r.right + 10, 10, window.innerWidth - m.width - 10);

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
}

function getInitials(label: string) {
    const cleaned = (label || "").trim();
    if (!cleaned) return "U";

    const base = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
    const parts = base.split(/[\s._-]+/).filter(Boolean);

    const a = parts[0]?.[0] ?? base[0] ?? "U";
    const b = (parts[1]?.[0] ?? parts[0]?.[1] ?? "") || "";
    return (a + b).toUpperCase();
}

document.addEventListener("DOMContentLoaded", () => {
    const root = document.documentElement;

    // ===== Sidebar expand/recolhe =====
    const sidebarToggle = qs<HTMLButtonElement>("#sidebarToggle");

    function isExpanded() {
        return root.getAttribute("data-sidebar") === "expanded";
    }

    function setExpanded(expanded: boolean) {
        if (expanded) {
            root.setAttribute("data-sidebar", "expanded");
            localStorage.setItem(SIDEBAR_KEY, "expanded");
        } else {
            root.removeAttribute("data-sidebar");
            localStorage.setItem(SIDEBAR_KEY, "collapsed");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
            sidebarToggle.setAttribute("title", expanded ? "Recolher menu" : "Expandir menu");
            sidebarToggle.setAttribute("aria-label", expanded ? "Recolher menu" : "Expandir menu");
        }
    }

    if (sidebarToggle) {
        const stored = localStorage.getItem(SIDEBAR_KEY);
        const initial =
            root.getAttribute("data-sidebar") === "expanded" || stored === "expanded";
        setExpanded(initial);

        sidebarToggle.addEventListener("click", () => setExpanded(!isExpanded()));
    }

    // ===== Menus (Tema + Conta) =====
    const themeBtn = qs<HTMLButtonElement>("#themeBtn");
    const themeMenu = qs<HTMLElement>("#themeMenu");

    const accountBtn = qs<HTMLButtonElement>("#accountBtn");
    const accountMenu = qs<HTMLElement>("#accountMenu");

    const backdrop = qs<HTMLElement>("#backdrop");
    const avatar = qs<HTMLElement>("#avatar");

    // Se algo essencial não existe, não quebra a página
    if (!themeBtn || !themeMenu || !accountBtn || !accountMenu || !backdrop) return;

    // ✅ “Fix” do TS: cria referências não-nulas para usar dentro das funções
    const themeBtnEl = themeBtn;
    const themeMenuEl = themeMenu;
    const accountBtnEl = accountBtn;
    const accountMenuEl = accountMenu;
    const backdropEl = backdrop;

    // Avatar
    if (avatar) {
        const label = accountBtnEl.dataset.user || "";
        avatar.textContent = getInitials(label);
    }

    let openMenuEl: HTMLElement | null = null;
    let openAnchorEl: HTMLElement | null = null;

    function closeMenus() {
        if (openMenuEl) openMenuEl.hidden = true;

        backdropEl.hidden = true;

        themeBtnEl.setAttribute("aria-expanded", "false");
        accountBtnEl.setAttribute("aria-expanded", "false");

        openMenuEl = null;

        if (openAnchorEl) {
            openAnchorEl.focus();
            openAnchorEl = null;
        }
    }

    function openMenu(menu: HTMLElement, anchor: HTMLButtonElement) {
        closeMenus();
        backdropEl.hidden = false;

        menu.hidden = false;
        positionMenu(menu, anchor);

        openMenuEl = menu;
        openAnchorEl = anchor;

        anchor.setAttribute("aria-expanded", "true");
    }

    // Tema: estado inicial + listeners
    const mode = readTheme();
    applyTheme(mode);
    setMenuRadioState(themeMenuEl, mode);

    // Se o sistema mudar e estiver em “system”, atualiza ícones/tema efetivo
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", () => {
        if (readTheme() === "system") applyTheme("system");
    });

    // Sync multi-aba
    window.addEventListener("storage", (ev) => {
        if (ev.key === THEME_KEY) {
            const m = readTheme();
            applyTheme(m);
            setMenuRadioState(themeMenuEl, m);
        }
        if (ev.key === SIDEBAR_KEY && sidebarToggle) {
            const expanded = localStorage.getItem(SIDEBAR_KEY) === "expanded";
            setExpanded(expanded);
        }
    });

    themeBtnEl.addEventListener("click", () => {
        if (!themeMenuEl.hidden) return closeMenus();
        setMenuRadioState(themeMenuEl, readTheme());
        openMenu(themeMenuEl, themeBtnEl);
    });

    themeMenuEl.addEventListener("click", (ev) => {
        const t = ev.target as HTMLElement | null;
        const btn = t?.closest<HTMLElement>("[data-theme]");
        if (!btn) return;

        const v = btn.dataset.theme as ThemeMode | undefined;
        if (!v) return;

        setTheme(v);
        setMenuRadioState(themeMenuEl, v);
        closeMenus();
    });

    // Conta
    accountBtnEl.addEventListener("click", () => {
        if (!accountMenuEl.hidden) return closeMenus();
        openMenu(accountMenuEl, accountBtnEl);
    });

    // Backdrop / ESC / clique fora
    backdropEl.addEventListener("click", closeMenus);

    document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") closeMenus();
    });

    document.addEventListener("click", (ev) => {
        if (!openMenuEl) return;

        const t = ev.target as Node;
        const clickedInsideMenu = openMenuEl.contains(t);
        const clickedOnAnchor = themeBtnEl.contains(t) || accountBtnEl.contains(t);

        if (!clickedInsideMenu && !clickedOnAnchor) closeMenus();
    });

    window.addEventListener("resize", () => {
        if (!openMenuEl || !openAnchorEl) return;
        positionMenu(openMenuEl, openAnchorEl);
    });
});
