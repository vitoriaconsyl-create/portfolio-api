const express = require("express");
const pool = require("../database");
const criarProfileDto = require("../dtos/profileDto");
const criarProfileResponseDto = require("../dtos/profileResponseDto");

const router = express.Router();

// POST /api/profiles
router.post("/", async (req, res, next) => {
    try {
        const { nome, email, bio } = criarProfileDto(req.body);

        if (!nome) {
            const erro = new Error("O nome é obrigatório");
            erro.status = 400;
            return next(erro);
        }

        if (!email) {
            const erro = new Error("O e-mail é obrigatório");
            erro.status = 400;
            return next(erro);
        }

        const result = await pool.query(
            `
            INSERT INTO profiles (nome, email, bio)
            VALUES ($1, $2, $3)
            RETURNING id, nome, email, bio
            `,
            [nome, email, bio]
        );

        res.status(201).json(
            criarProfileResponseDto(result.rows[0])
        );

    } catch (error) {
        next(error);
    }
});

// GET /api/profiles/:id
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            const erro = new Error("ID do perfil inválido");
            erro.status = 400;
            return next(erro);
        }

        const result = await pool.query(
            `
            SELECT id, nome, email, bio
            FROM profiles
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {
            const erro = new Error("Perfil não encontrado");
            erro.status = 404;
            return next(erro);
        }

        res.status(200).json(
            criarProfileResponseDto(result.rows[0])
        );
    } catch (error) {
        next(error);
    }
});

module.exports = router;