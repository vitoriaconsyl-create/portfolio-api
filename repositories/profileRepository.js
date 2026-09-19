const pool = require("../database");

// Criar perfil
async function criar(nome, email, bio) {
    const result = await pool.query(
        `
        INSERT INTO profiles (nome, email, bio)
        VALUES ($1, $2, $3)
        RETURNING id, nome, email, bio
        `,
        [nome, email, bio]
    );

    return result.rows[0];
}

// Buscar perfil por ID
async function buscarPorId(id) {
    const result = await pool.query(
        `
        SELECT id, nome, email, bio
        FROM profiles
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0];
}

module.exports = {
    criar,
    buscarPorId
};