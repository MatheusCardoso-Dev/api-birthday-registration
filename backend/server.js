// server.js (cole/replace no backend/server.js)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// Caminhos
const FILE_PATH = path.join(__dirname, 'convidados.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Senha admin (troque se quiser)
const ADMIN_PASSWORD = "181012";

// Serve arquivos estáticos do frontend (index.html, style.css, admin.html, script.js)
app.use(express.static(FRONTEND_DIR));

// Rota inicial só para teste (pode acessar http://localhost:3000/)
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Rota para login admin
app.post('/admin/login', (req, res) => {
  const { senha } = req.body || {};
  if (senha === ADMIN_PASSWORD) return res.json({ autorizado: true });
  res.status(401).json({ autorizado: false });
});

// Rota para receber confirmações de presença
app.post('/confirmar', (req, res) => {
  try {
    const { nome, quantidade, mensagem } = req.body || {};
    if (!nome || typeof quantidade === 'undefined') {
      return res.status(400).json({ erro: 'Dados incompletos.' });
    }

    let convidados = [];
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf8') || '[]';
      convidados = JSON.parse(raw);
    }

    convidados.unshift({
      nome,
      quantidade,
      mensagem: mensagem || '',
      data: new Date().toISOString()
    });

    fs.writeFileSync(FILE_PATH, JSON.stringify(convidados, null, 2), 'utf8');

    return res.json({ sucesso: true, mensagem: 'Confirmação registrada com sucesso!' });
  } catch (err) {
    console.error('Erro /confirmar:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
});

// Rota para listar todos os convidados (usada pelo admin)
app.get('/convidados', (req, res) => {
  try {
    if (!fs.existsSync(FILE_PATH)) return res.json([]);
    const raw = fs.readFileSync(FILE_PATH, 'utf8') || '[]';
    const convidados = JSON.parse(raw);
    return res.json(convidados);
  } catch (err) {
    console.error('Erro /convidados:', err);
    return res.status(500).json([]);
  }
});

// Fallback: para qualquer outra rota, envia index.html (bom para SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(FRONTEND_DIR, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(404).send('Not found');
});

// Start
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
