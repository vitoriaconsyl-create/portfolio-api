const express = require("express");
const projectRepository = require("../repositories/projectRepository");
const criarProjectDto = require("../dtos/projectDto");
const criarProjectResponseDto = require("../dtos/projectResponseDto");

const criarErro = (mensagem, status) => {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;

}

const router = express.Router();

// POST /api/projects
router.post("/", async (req, res, next) => {
    try {
        const {
            nome,
            profile_id,
            tecnologias
        } = criarProjectDto(req.body);

        if (!nome) {
            return next(
                criarErro("O nome do projeto é obrigatório", 400)
            );
        }

        if (!profile_id) {
            return next(
                criarErro("O perfil é obrigatório", 400)
            );
        }

        if (!Array.isArray(tecnologias)) {
            return next(
                criarErro("Tecnologias deve ser uma lista", 400)
            );
        }

        const perfilExiste =
            await projectRepository.perfilExiste(profile_id);

        if (!perfilExiste) {
            return next(
                criarErro("Perfil não encontrado", 404)
            );
        }

        const tecnologiasExistem =
            await projectRepository.tecnologiasExistem(tecnologias);

        if (!tecnologiasExistem) {
            return next(
                criarErro(
                    "Uma ou mais tecnologias não foram encontradas",
                    404
                )
            );
        }

        const projeto = await projectRepository.criar(
            nome,
            profile_id
        );

        await projectRepository.adicionarTecnologias(
            projeto.id,
            tecnologias
        );

        const tecnologiasCadastradas =
            await projectRepository.buscarTecnologias(projeto.id);

        res.status(201).json(
            criarProjectResponseDto({
                ...projeto,
                tecnologias: tecnologiasCadastradas
            })
        );

    } catch (error) {
        next(error);
    }
});

// Pesquisar
// GET /api/projects
router.get("/", async (req, res, next) => {
    try {
        const {
            technology,
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (pageNumber < 1 || limitNumber < 1) {
            return next(
                criarErro(
                    "Página e limite devem ser maiores que zero",
                    400
                )
            );
        }

        const projects = await projectRepository.listar(
            technology,
            pageNumber,
            limitNumber
        );

        const total = await projectRepository.contar(
            technology
        );

        res.status(200).json({
            page: pageNumber,
            limit: limitNumber,
            total: total,
            projects: projects.map(criarProjectResponseDto)
        });

    } catch (error) {
        next(error);
    }
});
// POST feedback
router.post("/:id/feedbacks", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { nota, comentario } = req.body;

        if (!Number.isInteger(id)) {
            return next(
                criarErro("ID do projeto inválido", 400)
            );
        }

        if (nota === undefined || nota < 1 || nota > 5) {
            return next(
                criarErro("A nota deve estar entre 1 e 5", 400)
            );
        }

        if (!comentario) {
            return next(
                criarErro("O comentário é obrigatório", 400)
            );
        }

        const projeto =
            await projectRepository.buscarPorId(id);

        if (!projeto) {
            return next(
                criarErro("Projeto não encontrado", 404)
            );
        }

        const feedback =
            await projectRepository.criarFeedback(
                id,
                nota,
                comentario
            );

        const media =
            await projectRepository.calcularMedia(id);

        await projectRepository.atualizarMedia(
            id,
            media
        );

        res.status(201).json({
            mensagem: "Feedback cadastrado com sucesso",
            feedback: feedback,
            media: Number(media.toFixed(2))
        });

    } catch (error) {
        next(error);
    }
});
// Curtidas 

router.put("/:id/upvote", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return next(
                criarErro("ID do projeto inválido", 400)
            );
        }

        const projeto =
            await projectRepository.adicionarUpvote(id);

        if (!projeto) {
            return next(
                criarErro("Projeto não encontrado", 404)
            );
        }

        res.status(200).json({
            mensagem: "Upvote registrado com sucesso",
            projeto: projeto
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;