// server.js (versão para Vercel Serverless)
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Caminho do arquivo JSON onde salvará as confirmações
const FILE_PATH = path.join(__dirname, "convidados.json");

// Senha admin (pode alterar se quiser)
const ADMIN_PASSWORD = "181012";

// Rota para login admin
app.post("/admin/login", (req, res) => {
  const { senha } = req.body || {};
  if (senha === ADMIN_PASSWORD) {
    return res.json({ autorizado: true });
  }
  res.status(401).json({ autorizado: false });
});

// Rota para receber confirmações de presença
app.post("/confirmar", (req, res) => {
  try {
    const { nome, quantidade, mensagem } = req.body || {};
    if (!nome || typeof quantidade === "undefined") {
      return res.status(400).json({ erro: "Dados incompletos." });
    }

    let convidados = [];
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, "utf8") || "[]";
      convidados = JSON.parse(raw);
    }

    convidados.unshift({
      nome,
      quantidade,
      mensagem: mensagem || "",
      data: new Date().toISOString(),
    });

    fs.writeFileSync(FILE_PATH, JSON.stringify(convidados, null, 2), "utf8");

    return res.json({
      sucesso: true,
      mensagem: "Confirmação registrada com sucesso!",
    });
  } catch (err) {
    console.error("Erro /confirmar:", err);
    return res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// Rota para listar convidados (apenas admin usa)
app.get("/convidados", (req, res) => {
  try {
    if (!fs.existsSync(FILE_PATH)) return res.json([]);
    const raw = fs.readFileSync(FILE_PATH, "utf8") || "[]";
    const convidados = JSON.parse(raw);
    return res.json(convidados);
  } catch (err) {
    console.error("Erro /convidados:", err);
    return res.status(500).json([]);
  }
});

// Exporta o app para o Vercel
module.exports = app;
