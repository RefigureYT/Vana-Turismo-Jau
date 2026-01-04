// public/static/login/login.ts

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".form") as HTMLFormElement | null;
    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const passwordInput = document.getElementById("password") as HTMLInputElement | null;
    const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement | null;

    if (!form || !emailInput || !passwordInput || !submitBtn) {
        return;
    }

    let isSubmitting = false;

    // Validação e normalização no submit
    form.addEventListener("submit", (event) => {
        if (isSubmitting) {
            event.preventDefault();
            return;
        }

        // Normaliza email (lowercase + trim)
        const email = emailInput.value.trim().toLowerCase();
        emailInput.value = email;

        if (!email || !passwordInput.value) {
            event.preventDefault();
            alert("Por favor, preencha e-mail e senha.");
            return;
        }

        // Bloqueia duplo submit
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "Entrando...";
    });

    // Botões de mostrar/ocultar senha
    const toggleButtons = document.querySelectorAll<HTMLButtonElement>(".toggle-password");

    toggleButtons.forEach((btn) => {
        const targetId = btn.dataset.target;
        if (!targetId) return;

        const targetInput = document.getElementById(targetId) as HTMLInputElement | null;
        if (!targetInput) return;

        btn.addEventListener("click", () => {
            const isPassword = targetInput.type === "password";
            targetInput.type = isPassword ? "text" : "password";
            btn.textContent = isPassword ? "Ocultar" : "Mostrar";
        });
    });
});