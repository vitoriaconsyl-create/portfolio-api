function criarProfileDto(dados) {
    return {
        nome: dados.nome?.trim(),
        email: dados.email?.trim(),
        bio: dados.bio?.trim() || null
    };
}

module.exports = criarProfileDto;