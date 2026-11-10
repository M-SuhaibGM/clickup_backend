"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const notFound = (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};
exports.notFound = notFound;
const errorHandler = (err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};
exports.errorHandler = errorHandler;
