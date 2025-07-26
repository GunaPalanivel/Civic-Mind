"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const intelligence_1 = __importDefault(require("./routes/intelligence"));
const createApp = () => {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({ origin: true }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Health check endpoint
    app.get("/health", (req, res) => {
        res.json({
            success: true,
            message: "Civic Mind API is operational",
            timestamp: new Date().toISOString(),
            environment: "firebase-functions",
            version: "1.0.0",
        });
    });
    // Register route modules
    app.use("/", intelligence_1.default);
    // 404 handler
    app.use("*", (req, res) => {
        res.status(404).json({
            success: false,
            error: "Endpoint not found",
            path: req.originalUrl,
            timestamp: new Date().toISOString(),
        });
    });
    // Error handler
    app.use((err, req, res, next) => {
        console.error("Express error:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            timestamp: new Date().toISOString(),
        });
    });
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map