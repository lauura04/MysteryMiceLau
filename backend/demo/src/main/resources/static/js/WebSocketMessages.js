// WebSocketMessages.js
export const MSG_TYPES = {
    PLAYER_JOIN: 'j',
    PLAYER_UPDATE: 'u',
    GAME_START: 's',
    ERROR: 'e',
    DOOR_INTERACT: 'd', // Tipo para enviar la interacción de la puerta al servidor
    DOOR_INTERACT_CONFIRM: 'k', // Tipo que el servidor envía para confirmar la interacción
    HOLE_INTERACT: 'g', // 
    HOLE_INTERACT_CONFIRMED: 'h', // 

    DOOR_INTERACTION_CONFIRMED: 'd' //servidor confirma
    // ... otros tipos de mensajes
};