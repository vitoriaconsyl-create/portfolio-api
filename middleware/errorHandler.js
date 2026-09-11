const errorHandler = (err, req, res, next) => {
    console.error(err);

    const status = err.status || 500;

    res.status(status).json({
        erro: err.message || "Ocorreu um erro interno no servidor."
    });
};

module.exports = errorHandler;