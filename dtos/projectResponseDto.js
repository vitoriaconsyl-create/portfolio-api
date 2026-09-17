function criarProjectResponseDto(projeto) {
    return {
        id: projeto.id,
        nome: projeto.nome,
        tecnologia: projeto.tecnologia,
        profile_id: projeto.profile_id,
        curtidas: projeto.curtidas,
        media_avaliacao: projeto.media_avaliacao,
        tecnologias: projeto.tecnologias || []
    };
}

module.exports = criarProjectResponseDto;