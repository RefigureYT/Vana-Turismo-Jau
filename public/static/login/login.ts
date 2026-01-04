// public/static/login/login.ts

export function qs<T extends Element>(sel: string, root: ParentNode = document): T | null {
    return root.querySelector(sel) as T | null;
}

function setToggleState(btn: HTMLButtonElement, isVisible: boolean): void {
    btn.setAttribute("aria-pressed", String(isVisible));
    btn.setAttribute("aria-label", isVisible ? "Ocultar senha" : "Mostrar senha");

    const labelEl = btn.querySelector<HTMLElement>(".toggle-password__text");
    const label = isVisible ? "Ocultar" : "Mostrar";

    if (labelEl) labelEl.textContent = label;
    else btn.textContent = label;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = qs<HTMLFormElement>("form");
    if (!form) return;

    const emailInput = qs<HTMLInputElement>('input[name="email"]', form);
    const passInput = qs<HTMLInputElement>('input[name="password"]', form);
    const submitBtn = qs<HTMLButtonElement>('button[type="submit"]', form);

    // Toggle mostrar/ocultar senha
    if (passInput) {
        const targetId = passInput.id || "password";

        let toggleBtn =
            qs<HTMLButtonElement>(".toggle-password", form) ||
            qs<HTMLButtonElement>(`button[data-target="${targetId}"]`, form);

        // Fallback: se não existir botão no HTML, cria um (evita quebrar se mudar o template)
        if (!toggleBtn) {
            toggleBtn = document.createElement("button");
            toggleBtn.type = "button";
            toggleBtn.className = "toggle-password";
            toggleBtn.setAttribute("data-target", targetId);
            toggleBtn.setAttribute("aria-label", "Mostrar senha");
            toggleBtn.setAttribute("aria-pressed", "false");

            const span = document.createElement("span");
            span.className = "toggle-password__text";
            span.textContent = "Mostrar";
            toggleBtn.appendChild(span);

            // tenta inserir após o input (caso não tenha wrapper)
            passInput.insertAdjacentElement("afterend", toggleBtn);
        }

        // estado inicial
        setToggleState(toggleBtn, passInput.type === "text");

        toggleBtn.addEventListener("click", () => {
            const willShow = passInput.type === "password";
            passInput.type = willShow ? "text" : "password";
            setToggleState(toggleBtn!, passInput.type === "text");
            passInput.focus();
        });

        // Extra (leve): ESC oculta a senha se estiver visível
        passInput.addEventListener("keydown", (ev) => {
            if (ev.key === "Escape" && passInput.type === "text") {
                passInput.type = "password";
                setToggleState(toggleBtn!, false);
            }
        });
    }

    form.addEventListener("submit", (e) => {
        const email = (emailInput?.value ?? "").trim().toLowerCase();
        const pass = passInput?.value ?? "";

        if (!email || !pass) {
            e.preventDefault();
            alert("Preencha e-mail e senha.");
            return;
        }

        // normaliza e-mail antes de enviar
        if (emailInput) emailInput.value = email;

        // evita clique duplo
        if (submitBtn) {
            submitBtn.disabled = true;
            const oldText = submitBtn.textContent;
            submitBtn.textContent = "Entrando...";

            // fallback: se não navegar por algum motivo, reabilita em 6s
            window.setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = oldText ?? "Entrar";
            }, 6000);
        }
    });
});
