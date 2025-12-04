const loginBox = document.getElementById("loginBox");
const painel = document.getElementById("painel");
const erro = document.getElementById("erro");
const logoutBtn = document.getElementById("logoutBtn");

document.getElementById("btnLogin").addEventListener("click", login);

function login() {
    const senha = document.getElementById("senha").value;

    fetch("http://localhost:3000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha })
    })
    .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
    })
    .then(() => {
        loginBox.classList.add("hidden");
        painel.classList.remove("hidden");
        carregarConvidados();
    })
    .catch(() => {
        erro.innerText = "Senha incorreta!";
    });
}

function carregarConvidados() {
    fetch("http://localhost:3000/convidados")
    .then(res => res.json())
    .then(lista => {
        const box = document.getElementById("lista");
        box.innerHTML = "";

        let totalPessoas = 0;

        lista.forEach(c => {
            totalPessoas += Number(c.quantidade);

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <strong>${c.nome}</strong>
                <p>Quantidade: ${c.quantidade}</p>
                <p>Mensagem: ${c.mensagem}</p>
                <p>Data: ${new Date(c.data).toLocaleString("pt-BR")}</p>
            `;
            box.appendChild(card);
        });

        document.getElementById("totalConfirmados").innerText = lista.length;
        document.getElementById("totalPessoas").innerText = totalPessoas;
    });
}

logoutBtn.addEventListener("click", () => {
    painel.classList.add("hidden");
    loginBox.classList.remove("hidden");
});
