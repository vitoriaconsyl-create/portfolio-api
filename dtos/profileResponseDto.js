function criarProfileResponseDto(perfil) {
    return {
        id: perfil.id,
        nome: perfil.nome,
        email: perfil.email,
        bio: perfil.bio
    };
}

module.exports = criarProfileResponseDto;