"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CIVIC_CATEGORIES = exports.APP_CONFIG = void 0;
exports.APP_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    API_TIMEOUT: 30000, // 30 seconds
    ITEMS_PER_PAGE: 20
};
exports.CIVIC_CATEGORIES = [
    'infrastructure',
    'environment',
    'safety',
    'education',
    'healthcare',
    'transportation',
    'housing',
    'other'
];
//# sourceMappingURL=constants.js.map