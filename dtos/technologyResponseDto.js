function criarTechnologyResponseDto(tecnologia) {
    return {
        id: tecnologia.id,
        nome: tecnologia.nome
    };
}

module.exports = criarTechnologyResponseDto;