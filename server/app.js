const express = require('express');
const mssql = require('mssql');
require('dotenv').config({ path: '../.env' });  // Corrigido o caminho relativo para o arquivo .env

const app = express();
const port = 3000;

// Middleware para interpretar o corpo das requisições como JSON
app.use(express.json());

// Configuração da conexão com o banco de dados
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // necessário para o Azure
    trustServerCertificate: true // necessário para evitar erro com o certificado
  }
};

// Função para conectar ao banco de dados
const connectToDB = async () => {
  try {
    await mssql.connect(config);
    console.log("Conexão bem-sucedida ao banco de dados");
  } catch (err) {
    console.error("Erro de conexão: ", err);
  }
};

// Testar a conexão no início
connectToDB();

// Definir uma rota básica
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// Rota para buscar dados no banco
app.get('/data', async (req, res) => {
  try {
    const result = await mssql.query('SELECT * FROM tb_usuario');
    res.json(result.recordset);  // Retorna os dados da tabela como JSON
  } catch (err) {
    console.error("Erro na consulta SQL:", err);  // Exibe detalhes do erro no console
    res.status(500).send("Erro ao consultar o banco de dados");
  }
});

// Rota para autenticação de login
app.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;  // Recebe o usuário e a senha enviados no corpo da requisição

  try {
    // Consulta no banco de dados para verificar o usuário e senha
    const result = await mssql.query`
      SELECT * FROM tb_usuario WHERE NOME = ${usuario} AND SENHA = ${senha}
    `;

    // Verifica se encontrou um registro correspondente
    if (result.recordset.length > 0) {
      res.json({ message: 'Login bem-sucedido' });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas' });  // Retorna erro 401 se as credenciais forem inválidas
    }
  } catch (err) {
    console.error("Erro ao fazer login:", err);  // Exibe o erro de consulta
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
