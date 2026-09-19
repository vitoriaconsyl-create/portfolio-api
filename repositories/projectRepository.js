const pool = require("../database");

// Criar projeto
async function criar(nome, profile_id) {
    const result = await pool.query(
        `
        INSERT INTO projects
            (nome, profile_id, curtidas, media_avaliacao)
        VALUES
            ($1, $2, 0, 0)
        RETURNING
            id,
            nome,
            profile_id,
            curtidas,
            media_avaliacao
        `,
        [nome, profile_id]
    );

    return result.rows[0];
}

// Buscar projeto por ID
async function buscarPorId(id) {
    const result = await pool.query(
        `
        SELECT
            id,
            nome,
            profile_id,
            curtidas,
            media_avaliacao::float AS media_avaliacao
        FROM projects
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0];
}

// Listar projetos
async function listar(technology, pageNumber, limitNumber) {
    const offset = (pageNumber - 1) * limitNumber;

    let query = `
        SELECT
            p.id,
            p.nome,
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
        query += `
        WHERE EXISTS (
            SELECT 1
            FROM project_technologies pt
            INNER JOIN technologies t
                ON t.id = pt.tecnologia_id
            WHERE pt.projeto_id = p.id
              AND LOWER(TRIM(t.nome)) = LOWER(TRIM($1))
        )
    `;

        values.push(technology);
    }

    query += `
        ORDER BY p.id
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
    `;

    values.push(limitNumber, offset);

    const result = await pool.query(query, values);

    return result.rows;
}

// Contar projetos
async function contar(technology) {
    let query = `
        SELECT COUNT(*)
        FROM projects p
    `;

    const values = [];

    if (technology) {
        query += `
        WHERE EXISTS (
            SELECT 1
            FROM project_technologies pt
            INNER JOIN technologies t
                ON t.id = pt.tecnologia_id
            WHERE pt.projeto_id = p.id
              AND LOWER(TRIM(t.nome)) = LOWER(TRIM($1))
        )
    `;

        values.push(technology);
    }

    const result = await pool.query(query, values);

    return Number(result.rows[0].count);
}

// Verificar se o perfil existe
async function perfilExiste(profile_id) {
    const result = await pool.query(
        `
        SELECT id
        FROM profiles
        WHERE id = $1
        `,
        [profile_id]
    );

    return result.rows.length > 0;
}

// Verificar se as tecnologias existem
async function tecnologiasExistem(tecnologias) {
    if (tecnologias.length === 0) {
        return true;
    }

    const tecnologiasUnicas = [...new Set(tecnologias)];

    const result = await pool.query(
        `
        SELECT id
        FROM technologies
        WHERE id = ANY($1)
        `,
        [tecnologiasUnicas]
    );

    return result.rows.length === tecnologiasUnicas.length;
}

// Associar tecnologias ao projeto
async function adicionarTecnologias(projetoId, tecnologias) {
    const tecnologiasUnicas = [...new Set(tecnologias)];

    for (const tecnologiaId of tecnologiasUnicas) {
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
}

// Buscar tecnologias de um projeto
async function buscarTecnologias(projetoId) {
    const result = await pool.query(
        `
        SELECT
            t.id,
            t.nome
        FROM project_technologies pt
        JOIN technologies t
            ON t.id = pt.tecnologia_id
        WHERE pt.projeto_id = $1
        ORDER BY t.id
        `,
        [projetoId]
    );

    return result.rows;
}

// Criar feedback
async function criarFeedback(projetoId, nota, comentario) {
    const result = await pool.query(
        `
        INSERT INTO feedbacks
            (projeto_id, nota, comentario)
        VALUES
            ($1, $2, $3)
        RETURNING
            id,
            projeto_id,
            nota,
            comentario,
            criado_em
        `,
        [projetoId, nota, comentario]
    );

    return result.rows[0];
}

// Calcular média dos feedbacks
async function calcularMedia(projetoId) {
    const result = await pool.query(
        `
        SELECT AVG(nota) AS media
        FROM feedbacks
        WHERE projeto_id = $1
        `,
        [projetoId]
    );

    return Number(result.rows[0].media);
}

// Atualizar média do projeto
async function atualizarMedia(projetoId, media) {
    await pool.query(
        `
        UPDATE projects
        SET media_avaliacao = $1
        WHERE id = $2
        `,
        [media, projetoId]
    );
}

// Registrar upvote
async function adicionarUpvote(id) {
    const result = await pool.query(
        `
        UPDATE projects
        SET curtidas = curtidas + 1
        WHERE id = $1
        RETURNING
            id,
            nome,
            profile_id,
            curtidas,
            media_avaliacao::float AS media_avaliacao
        `,
        [id]
    );

    return result.rows[0];
}

module.exports = {
    criar,
    buscarPorId,
    listar,
    contar,
    perfilExiste,
    tecnologiasExistem,
    adicionarTecnologias,
    buscarTecnologias,
    criarFeedback,
    calcularMedia,
    atualizarMedia,
    adicionarUpvote
};