// WebSocketMessages.js
export const MSG_TYPES = {
    PLAYER_JOIN: 'j',
    PLAYER_UPDATE: 'u',
    GAME_START: 's', // ¡Este es el crucial!
    ABILITY_USE: 'a',
    DOOR_INTERACT: 'd',
    DOOR_INTERACT_CONFIRM: 'd', // Puedes usar el mismo tipo si la intención es la misma
    AGUJERO_INTERACT: 'g',
    AGUJERO_INTERACT_CONFIRM: 'g', // Puedes usar el mismo tipo
    GAME_OVER: 'o',
    MESSAGE: 'm',
    ERROR: 'e',
};