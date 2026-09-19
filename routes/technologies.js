const express = require("express");
const technologyRepository = require("../repositories/technologyRepository");
const criarTechnologyDto = require("../dtos/technologyDto");
const criarTechnologyResponseDto = require("../dtos/technologyResponseDto");

const router = express.Router();

// POST /api/technologies
router.post("/", async (req, res, next) => {
    try {
        const { nome } = criarTechnologyDto(req.body);

        if (!nome) {
            const erro = new Error("O nome da tecnologia é obrigatório");
            erro.status = 400;
            return next(erro);
        }

        const technology = await technologyRepository.criar(nome);

        res.status(201).json(
            criarTechnologyResponseDto(technology)
        );

    } catch (error) {
        next(error);
    }
});

// GET /api/technologies
router.get("/", async (req, res, next) => {
    try {
        const technologies = await technologyRepository.listar();

        res.status(200).json(
            technologies.map(criarTechnologyResponseDto)
        );

    } catch (error) {
        next(error);
    }
});

module.exports = router;