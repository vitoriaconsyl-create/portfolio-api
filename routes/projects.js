const express = require("express");
const pool = require("../database");

const criarErro = (mensagem, status) => {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;

}

const router = express.Router();

// POST /api/projects
router.post("/", async (req, res, next) => {
    try {
        const { nome, tecnologia, profile_id, tecnologias = [] } = req.body;

        if (!nome || !nome.trim()) {
            return next(criarErro("O nome do projeto é obrigatório", 400));
        }

        if (!tecnologia || !tecnologia.trim()) {
            return next(criarErro("A tecnologia é obrigatória", 400));
        }

        if (!profile_id) {
            return next(criarErro("O perfil é obrigatório", 400));
        }

        if (!Array.isArray(tecnologias)) {
            return next(criarErro("Tecnologias deve ser uma lista", 400));
        }

        const profileResult = await pool.query(
            "SELECT id FROM profiles WHERE id = $1",
            [profile_id]
        );

        if (profileResult.rows.length === 0) {
            return next(criarErro("Perfil não encontrado", 404));
        }

        if (tecnologias.length > 0) {
            const technologyResult = await pool.query(
                `
                SELECT id
                FROM technologies
                WHERE id = ANY($1)
                `,
                [tecnologias]
            );

            if (technologyResult.rows.length !== tecnologias.length) {
                return next(criarErro("Uma ou mais tecnologias não foram encontradas", 404));
            }
        }

        const projectResult = await pool.query(
            `
            INSERT INTO projects
                (nome, tecnologia, profile_id, curtidas, media_avaliacao)
            VALUES
                ($1, $2, $3, 0, 0)
            RETURNING
                id, nome, tecnologia, profile_id, curtidas, media_avaliacao
            `,
            [nome.trim(), tecnologia.trim(), profile_id]
        );

        const projetoId = projectResult.rows[0].id;

        for (const tecnologiaId of tecnologias) {
            await pool.query(
                `
                INSERT INTO project_technologies
                    (projeto_id, tecnologia_id)
                VALUES
                    ($1, $2)
                `,
                [projetoId, tecnologiaId]
            );
        }

        res.status(201).json({
            ...projectResult.rows[0],
            tecnologias
        });

    } catch (error) {
        next(error);
    }
});

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
    SELECT
        p.id,
        p.nome,
        p.tecnologia,
        p.profile_id,
        p.curtidas,
        p.media_avaliacao::float AS media_avaliacao,

        (
            SELECT json_agg(
                json_build_object(
                    'id', t.id,
                    'nome', t.nome
                )
                ORDER BY t.id
            )
            FROM project_technologies pt
            JOIN technologies t
                ON t.id = pt.tecnologia_id
            WHERE pt.projeto_id = p.id
        ) AS tecnologias

    FROM projects p
`;

        const values = [];

        if (technology) {
            query += ` WHERE LOWER(p.tecnologia) = LOWER($1)`;
            values.push(technology);
        }

        query += ` ORDER BY p.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

        values.push(limitNumber, offset);

        const result = await pool.query(query, values);

        let countQuery = `
            SELECT COUNT(*) 
            FROM projects p
        `;

        const countValues = [];

        if (technology) {
            countQuery += ` WHERE LOWER(p.tecnologia) = LOWER($1)`;
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