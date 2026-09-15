const express = require("express");
const projectsRouter = require("./routes/projects");
const profilesRouter = require("./routes/profiles");
const technologiesRouter = require("./routes/technologies");
const errorHandler = require("./middleware/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const pool = require("./database");

const app = express();

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/projects", projectsRouter);
app.use("/api/profiles", profilesRouter);
app.use("/api/technologies", technologiesRouter);

app.use((req, res, next) => {
    const erro = new Error("Rota não encontrada");
    erro.status = 404;
    next(erro);
});

app.use(errorHandler);

pool.query("SELECT NOW()")
    .then(() => {
        console.log("Banco de dados conectado!");
    })
    .catch((error) => {
        console.error("Erro ao conectar ao banco:", error.message);
    });

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});