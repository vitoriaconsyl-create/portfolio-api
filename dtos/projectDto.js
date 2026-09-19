function criarProjectDto(dados) {
    return {
        nome: dados.nome?.trim(),
        profile_id: dados.profile_id,
        tecnologias: dados.tecnologias
    };
}

module.exports = criarProjectDto;