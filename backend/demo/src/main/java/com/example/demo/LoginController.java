package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;



@RestController
@RequestMapping("/usuario")
public class LoginController {

    // Registrar Usuario
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@RequestBody Usuario usuario){
        try {
            String nombreUsuario = usuario.getId();
            String password = usuario.getPassword();
            File archivoGeneral = new File("usuarios/usuarios.txt");
            File carpeta = new File("usuarios");

            if (!carpeta.exists()) carpeta.mkdirs(); // Si no existe la carpeta, la crea

            // Verificar si el usuario ya existe
            if (archivoGeneral.exists()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(archivoGeneral))) {
                    String linea;
                    while ((linea = reader.readLine()) != null) {
                        String[] partes = linea.split(",");
                        if (partes.length >= 1 && partes[0].equals(nombreUsuario)) {
                            return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("success", false, "message", "Este nombre ya existe"));
                        }
                    }
                }
            }

            // Guarda la información en uno general
            try (FileWriter write = new FileWriter(archivoGeneral, true)) {
                write.write(nombreUsuario + "," + password + ",0\n");
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("success", true, "message", "Usuario registrado correctamente"));

        } catch(Exception e){
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error al registrar usuario"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Usuario user) {
        String nombreUsuario = user.getId();
        String password = user.getPassword();

        File archivoGeneral = new File("usuarios/usuarios.txt");

        if (!archivoGeneral.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("success", false, "message", "No hay usuarios registrados"));
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(archivoGeneral))) {
            String linea;
            while ((linea = reader.readLine()) != null) {
                String[] partes = linea.split(",");
                if (partes.length >= 2) {
                    String usuarioGuardado = partes[0];
                    String passwordGuardada = partes[1];
                    if (usuarioGuardado.equals(nombreUsuario)) {
                        if (passwordGuardada.equals(password)) {
                            return ResponseEntity.ok()
                                .body(Map.of("success", true, "message", "Inicio de sesión existoso"));
                        } else {
                            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("success", false, "message", "Contraseña incorrecta"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error leyendo el archivo"));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("success", false, "message", "Usuario no encontrado"));
    }
    

    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAuth() {
        
        return ResponseEntity.ok().body((Map.of("authenticated", true)));
    }
    
    public String requestMethodName(@RequestParam String param) {
        return new String();
    }
    
}
