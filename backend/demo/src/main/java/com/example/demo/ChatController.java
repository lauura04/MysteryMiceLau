package com.example.demo;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*") // Permitir solicitudes desde cualquier origen
public class ChatController {

    
    private final List<ChatMessage> messages = new ArrayList<>();
    private final AtomicInteger lastMessageId = new AtomicInteger(0); 
    private final ConcurrentHashMap<Integer, ClientInfo> activeClients = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> userNamesToIds = new ConcurrentHashMap<>();
    private final AtomicInteger userIdCounter = new AtomicInteger(1);

    private static class ClientInfo {
        private final int userId;
        private final String userName;
        private long lastActivityTimestamp; 
        public ClientInfo(int userId, String userName, long lastActivityTimestamp) {
            this.userId = userId;
            this.userName = userName;
            this.lastActivityTimestamp = lastActivityTimestamp;
        }

        public int getUserId() { return userId; }
        public String getUserName() { return userName; }
        public long getLastActivityTimestamp() { return lastActivityTimestamp; }

       public void setLastActivityTimestamp(long lastActivityTimestamp) {
            this.lastActivityTimestamp = lastActivityTimestamp;
        }
    }

    public static class ChatResponse {
        private final List<ChatMessage> messages;
        private final int timestamp; 
        public ChatResponse(List<ChatMessage> messages, int timestamp) {
            this.messages = messages;
            this.timestamp = timestamp;
        }

        public List<ChatMessage> getMessages() {
            return messages;
        }

        public int getTimestamp() {
            return timestamp;
        }
    }


    // --- Endpoints ---

    @GetMapping
    public ChatResponse getMessages(@RequestParam(defaultValue = "0") int since) {
        List<ChatMessage> newMessages = new ArrayList<>();
        int latestId = since; 
        synchronized (messages) {
            for (ChatMessage msg : messages) {
                if (msg.getId() > since) {
                    newMessages.add(msg);
                    latestId = msg.getId(); // Asegurarse de que latestId sea el máximo ID de los mensajes nuevos
                }
            }
        }
        return new ChatResponse(newMessages, latestId);
    }

    @GetMapping("/activeClients")
    public int getActiveClients() {
        int currentActiveClients = activeClients.size();
        System.out.println(currentActiveClients);
         return currentActiveClients; 
    }

    @PostMapping
    public ResponseEntity<Void> postMessage(@RequestParam String message, @RequestParam int userId) {
        
        ClientInfo client = activeClients.get(userId);
        if (client == null) {
            System.err.println("Intento de enviar mensaje por userId inactivo: " + userId + ". Mensaje: " + message);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        
        String userName = client.getUserName(); 
        
        synchronized (messages) {
            messages.add(new ChatMessage(lastMessageId.incrementAndGet(), userId, userName, message));
            if (messages.size() > 50) {
                messages.remove(0); // Almacenar los últimos 50 mensajes
            }
        }
        return ResponseEntity.ok().build(); // Devuelve 200 OK
    }

    @PostMapping("/connect")
    public ResponseEntity<Integer> connectClient(@RequestParam String nombre) {
        
        Integer existingUserId = userNamesToIds.get(nombre);

        if (existingUserId != null && activeClients.containsKey(existingUserId)) {
            // El usuario ya está conectado o se está reconectando con un ID válido
            ClientInfo client = activeClients.get(existingUserId);
            client.setLastActivityTimestamp(System.currentTimeMillis()); // Actualizar timestamp de actividad
            System.out.println("Usuario " + nombre + " reconectado con ID existente: " + existingUserId);
            return ResponseEntity.ok(existingUserId);
        }

        // Si el nombre no tiene un ID registrado, o el ID registrado ya no está activo, crea uno nuevo.
        int newUserId = userIdCounter.getAndIncrement();
        ClientInfo newClient = new ClientInfo(newUserId, nombre, System.currentTimeMillis());
        
        activeClients.put(newUserId, newClient);
        userNamesToIds.put(nombre, newUserId); // Guardar el mapeo de nombre a ID

        System.out.println("Nuevo usuario conectado: " + nombre + " con ID: " + newUserId);
        return ResponseEntity.ok(newUserId);
    }

    @PostMapping("/disconnect")
    public ResponseEntity<Integer> disconnectClient(@RequestParam int userId) {
        ClientInfo removedClient = activeClients.remove(userId); // Remueve de activeClients
        if (removedClient != null) {
            userNamesToIds.remove(removedClient.getUserName()); // Remueve también del mapeo por nombre
            System.out.println("Usuario desconectado: " + removedClient.getUserName() + " (ID: " + userId + ")");
        } else {
            System.out.println("Intento de desconectar ID inexistente: " + userId);
        }
        return ResponseEntity.ok(activeClients.size());
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(@RequestParam int userId) {
        ClientInfo client = activeClients.get(userId);
        if (client != null) {
            client.setLastActivityTimestamp(System.currentTimeMillis());
            return ResponseEntity.ok().build();
        } else {
            // Si el userId no se encuentra, podría significar que fue limpiado por inactividad.
            // El cliente recibirá un 404 NOT_FOUND y debería intentar reconectar.
            System.out.println("Heartbeat recibido para ID inactivo/desconocido: " + userId + ". Respondiendo 404.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); 
        }
    }
    
    // Método programado para limpiar usuarios inactivos
    @Scheduled(fixedRate = 5000) // Se ejecutará cada 5 segundos
    public void removeInactiveUsers() {
        long currentTime = System.currentTimeMillis();
        // Definir el umbral de inactividad (ej. 10 segundos). Debe ser mayor que el intervalo del heartbeat (3s).
        long inactivityThreshold = 10 * 1000; 
        
        // Usar removeIf para eliminar de forma segura mientras se itera
        activeClients.entrySet().removeIf(entry -> {
            ClientInfo client = entry.getValue();
            if (currentTime - client.getLastActivityTimestamp() > inactivityThreshold) {
                System.out.println("Limpiando usuario inactivo: " + client.getUserName() + " (ID: " + client.getUserId() + ")");
                userNamesToIds.remove(client.getUserName()); // Remover también del mapeo por nombre
                return true; // Indica que esta entrada debe ser eliminada
            }
            return false;
        });
    }
}