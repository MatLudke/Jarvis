"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionHistory = getSessionHistory;
exports.updateSessionHistory = updateSessionHistory;
const DEFAULT_MAX_SESSION_TURNS = 4;
function parseMaxSessionTurns(raw) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_MAX_SESSION_TURNS;
    }
    return Math.floor(parsed);
}
function getSessionHistory(attributes) {
    return Array.isArray(attributes.chatHistory) ? attributes.chatHistory : [];
}
function updateSessionHistory(attributes, userQuestion, assistantAnswer) {
    const history = getSessionHistory(attributes);
    const maxTurns = parseMaxSessionTurns(process.env.MAX_SESSION_TURNS);
    const maxEntries = maxTurns * 2;
    const appendedHistory = [
        ...history,
        { role: 'user', text: userQuestion },
        { role: 'assistant', text: assistantAnswer }
    ];
    const nextHistory = appendedHistory.slice(-maxEntries);
    return {
        ...attributes,
        chatHistory: nextHistory
    };
}
