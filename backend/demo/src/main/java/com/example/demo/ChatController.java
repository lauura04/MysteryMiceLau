package com.example.demo;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.catalina.util.CharsetMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*") // Permitir solicitudes desde cualquier origen
public class ChatController {

    private final List<ChatMessage> messages = new ArrayList<>();
    private final AtomicInteger lastId = new AtomicInteger(0);
    private final ConcurrentHashMap<Integer, Long> activeUsers = new ConcurrentHashMap<>(); //otro mapa igual para los UserName
    private final AtomicInteger userIdCounter = new AtomicInteger(1);
    private final ConcurrentHashMap<Integer, String> userNames = new ConcurrentHashMap<>();



    @GetMapping
    public ChatResponse getMessages(@RequestParam(defaultValue = "0") int since) {
        List<ChatMessage> newMessages = new ArrayList<>();
        int latestId = since;

        synchronized (messages) {
            for (ChatMessage msg : messages) {
                if (msg.getId() > since) {
                    newMessages.add(msg);
                    latestId = msg.getId();
                }
            }
        }
        return new ChatResponse(newMessages, latestId);
    }

    @GetMapping("/activeClients")
    public int getActiveClients() {
        return activeUsers.size();
    }

    @PostMapping
    public void postMessage(@RequestParam String message, @RequestParam int userId) {
        String userName = userNames.getOrDefault(userId, "Usuario");
        synchronized (messages) {
            messages.add(new ChatMessage(lastId.incrementAndGet(), userId, userName, message));
            if (messages.size() > 50) {
                messages.remove(0); // Almacenar los últimos 50 mensajes
            }
        }
        
    }

    @PostMapping("/connect")
    public int connectClient(@RequestParam String nombre) {
        int newUserId = userIdCounter.getAndIncrement();
        activeUsers.put(newUserId, System.currentTimeMillis());
        userNames.put(newUserId, nombre);
        return newUserId;
    }

    @PostMapping("/disconnect")
    public int disconnectClient(@RequestParam int userId) {
        activeUsers.remove(userId);
        userNames.remove(userId);
        return activeUsers.size();
    }

    @PostMapping("/heartbeat")
    public void heartbeat(@RequestParam int userId) {
        if(activeUsers.containsKey(userId)){
            activeUsers.put(userId, System.currentTimeMillis());
        }
    }
    
    @Scheduled(fixedRate = 2000) // Cada 2 segundos
    public void removeInactiveUsers() {
        long currentTime = System.currentTimeMillis();
        activeUsers.forEach((userId, lastActive) -> {
            if (currentTime - lastActive > 10000) { // Más de 10 segundos inactivo
                activeUsers.remove(userId);
                System.out.println("Usuario " + userId + " desconectado por inactividad");
            }
        });
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
}
