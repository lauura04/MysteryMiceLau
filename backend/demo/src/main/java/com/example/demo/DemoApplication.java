package com.example.demo;

import java.net.http.WebSocket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@SpringBootApplication
@EnableScheduling
@EnableWebSocket
public class DemoApplication{

	//private final GameWebSocketHandler gameWebSocketHandler;

	

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
