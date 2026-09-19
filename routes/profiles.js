const express = require("express");
const profileRepository = require("../repositories/profileRepository");
const criarProfileDto = require("../dtos/profileDto");
const criarProfileResponseDto = require("../dtos/profileResponseDto");

const router = express.Router();

// POST /api/profiles
router.post("/", async (req, res, next) => {
    try {
        const { nome, email, bio } = criarProfileDto(req.body);

        if (!nome) {
            const erro = new Error("O nome é obrigatório");
            erro.status = 400;
            return next(erro);
        }

        if (!email) {
            const erro = new Error("O e-mail é obrigatório");
            erro.status = 400;
            return next(erro);
        }

        const perfil = await profileRepository.criar(
            nome,
            email,
            bio
        );

        res.status(201).json(
            criarProfileResponseDto(perfil)
        );

    } catch (error) {
        next(error);
    }
});

// GET /api/profiles/:id
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            const erro = new Error("ID do perfil inválido");
            erro.status = 400;
            return next(erro);
        }

        const perfil = await profileRepository.buscarPorId(id);

        if (!perfil) {
            const erro = new Error("Perfil não encontrado");
            erro.status = 404;
            return next(erro);
        }

        res.status(200).json(
            criarProfileResponseDto(perfil)
        );
    } catch (error) {
        next(error);
    }
});

module.exports = router;