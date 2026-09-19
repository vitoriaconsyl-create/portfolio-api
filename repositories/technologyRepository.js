const pool = require("../database");

// Criar tecnologia
async function criar(nome) {
    const result = await pool.query(
        `
        INSERT INTO technologies (nome)
        VALUES ($1)
        RETURNING id, nome
        `,
        [nome]
    );

    return result.rows[0];
}

// Listar tecnologias
async function listar() {
    const result = await pool.query(
        `
        SELECT id, nome
        FROM technologies
        ORDER BY id
        `
    );

    return result.rows;
}

module.exports = {
    criar,
    listar
};