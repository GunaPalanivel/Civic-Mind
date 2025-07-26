"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdSchema = exports.emailSchema = void 0;
exports.validateEmail = validateEmail;
exports.validateUserId = validateUserId;
const zod_1 = require("zod");
exports.emailSchema = zod_1.z.string().email();
exports.userIdSchema = zod_1.z.string().min(1);
function validateEmail(email) {
    return exports.emailSchema.safeParse(email).success;
}
function validateUserId(id) {
    return exports.userIdSchema.safeParse(id).success;
}
//# sourceMappingURL=validation.js.map