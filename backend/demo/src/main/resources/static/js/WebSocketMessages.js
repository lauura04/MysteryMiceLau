// WebSocketMessages.js
export const MSG_TYPES = {
    INIT: 'i',        // Initialize game state
    POS: 'p',
    PLAYER_JOIN: 'j',
    PLAYER_UPDATE: 'u',
    GAME_START: 's',
    ERROR: 'e',
    DOOR_INTERACT: 'd', // Tipo para enviar la interacción de la puerta al servidor
    DOOR_INTERACT_CONFIRM: 'k', // Tipo que el servidor envía para confirmar la interacción
    AGUJERO_INTERACT: 'g', // Tipo para enviar la interacción del agujero al servidor
    AGUJERO_INTERACT_CONFIRM: 'h', // Tipo que el servidor envía para confirmar la interacción
    // ... otros tipos de mensajes
};