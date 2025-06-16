// WebSocketMessages.js
export const MSG_TYPES = {
    PLAYER_JOIN: 'j',
    PLAYER_UPDATE: 'u',
    GAME_START: 's',
    ERROR: 'e',
    DOOR_INTERACT: 'd', // Tipo para enviar la interacción de la puerta al servidor
    DOOR_INTERACT_CONFIRM: 'k', // Tipo que el servidor envía para confirmar la interacción
    AGUJERO_INTERACT: 'g', // Tipo para enviar la interacción del agujero al servidor
    AGUJERO_INTERACT_CONFIRM: 'h', // Tipo que el servidor envía para confirmar la interacción

    DOOR_INTERACTION_CONFIRMED: 'd' //servidor confirma
    // ... otros tipos de mensajes
};