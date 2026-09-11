const express = require("express");
const pool = require("../database");

const criarErro = (mensagem, status) => {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;

}

const router = express.Router();

// Pesquisar
router.get("/", async (req, res, next) => {
    try {
        const { technology, page = 1, limit = 10 } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (pageNumber < 1 || limitNumber < 1) {
            return next(
                criarErro("Página e limite devem ser maiores que zero", 400)
            );
        }

        const offset = (pageNumber - 1) * limitNumber;

        let query = `
            SELECT id, nome, tecnologia, curtidas, media_avaliacao::float AS media_avaliacao
            FROM projects
        `;

        const values = [];

        if (technology) {
            query += ` WHERE LOWER(tecnologia) = LOWER($1)`;
            values.push(technology);
        }

        query += ` ORDER BY id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

        values.push(limitNumber, offset);

        const result = await pool.query(query, values);

        let countQuery = `
            SELECT COUNT(*) 
            FROM projects
        `;

        const countValues = [];

        if (technology) {
            countQuery += ` WHERE LOWER(tecnologia) = LOWER($1)`;
            countValues.push(technology);
        }

        const countResult = await pool.query(countQuery, countValues);

        const total = Number(countResult.rows[0].count);

        res.status(200).json({
            page: pageNumber,
            limit: limitNumber,
            total: total,
            projects: result.rows
        });

    } catch (error) {
        next(error);
    }
});

router.post("/:id/feedbacks", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { nota, comentario } = req.body;

        if (!Number.isInteger(id)) {
            return next(criarErro("ID do projeto inválido", 400));
        }

        if (nota === undefined || nota < 1 || nota > 5) {
            return next(criarErro("A nota deve estar entre 1 e 5", 400));
        }

        if (!comentario) {
            return next(criarErro("O comentário é obrigatório", 400));
        }

        const projectResult = await pool.query(
            "SELECT id FROM projects WHERE id = $1",
            [id]
        );

        if (projectResult.rows.length === 0) {
            return next(criarErro("Projeto não encontrado", 404));
        }

        const feedbackResult = await pool.query(
            `
            INSERT INTO feedbacks (projeto_id, nota, comentario)
            VALUES ($1, $2, $3)
            RETURNING id, projeto_id, nota, comentario, criado_em
            `,
            [id, nota, comentario]
        );

        const averageResult = await pool.query(
            `
            SELECT AVG(nota) AS media
            FROM feedbacks
            WHERE projeto_id = $1
            `,
            [id]
        );

        const media = Number(averageResult.rows[0].media);

        await pool.query(
            `
            UPDATE projects
            SET media_avaliacao = $1
            WHERE id = $2
            `,
            [media, id]
        );

        res.status(201).json({
            mensagem: "Feedback cadastrado com sucesso",
            feedback: feedbackResult.rows[0],
            media: Number(media.toFixed(2))
        });

    } catch (error) {
        next(error);
    }
});

router.put("/:id/upvote", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return next(criarErro("ID do projeto inválido", 400));
        }

        const result = await pool.query(
            `
            UPDATE projects
            SET curtidas = curtidas + 1
            WHERE id = $1
            RETURNING id, nome, tecnologia, curtidas, media_avaliacao::float AS media_avaliacao
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return next(criarErro("Projeto não encontrado", 404));
        }

        res.status(200).json({
            mensagem: "Upvote registrado com sucesso",
            projeto: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;