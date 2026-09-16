function criarTechnologyDto(dados) {
    return {
        nome: dados.nome?.trim()
    };
}

module.exports = criarTechnologyDto;