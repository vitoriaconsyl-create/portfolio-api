const express = require("express");
const pool = require("../database");

const router = express.Router();

// POST /api/technologies
router.post("/", async (req, res, next) => {
    try {
        const { nome } = req.body;

        if (!nome || !nome.trim()) {
            const erro = new Error("O nome da tecnologia é obrigatório");
            erro.status = 400;
            return next(erro);
        }

        const result = await pool.query(
            `
            INSERT INTO technologies (nome)
            VALUES ($1)
            RETURNING id, nome
            `,
            [nome.trim()]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

// GET /api/technologies
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            `
            SELECT id, nome
            FROM technologies
            ORDER BY id
            `
        );

        res.status(200).json(result.rows);

    } catch (error) {
        next(error);
    }
});

module.exports = router;