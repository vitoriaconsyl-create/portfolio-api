function criarProjectDto(dados) {
    return {
        nome: dados.nome?.trim(),
        tecnologia: dados.tecnologia?.trim(),
        profile_id: dados.profile_id,
        tecnologias: Array.isArray(dados.tecnologias)
            ? dados.tecnologias
            : []
    };
}

module.exports = criarProjectDto;