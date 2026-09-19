function criarProjectResponseDto(projeto) {
    return {
        id: projeto.id,
        nome: projeto.nome,

        profile: {
            id: projeto.profile_id,
            nome: projeto.profile_nome
        },

        curtidas: projeto.curtidas,
        media_avaliacao: projeto.media_avaliacao,
        tecnologias: projeto.tecnologias || []
    };
}

module.exports = criarProjectResponseDto;