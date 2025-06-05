/*package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService{
    //Variable privada para acceder al repositorio
    @Autowired
    private UserRepository userRepository;

    //Devuelve en una lista de Usuarios todos los usuarios que hay en el repositorio
    public List<Usuario> listaUsuarios(){
        return userRepository.findAll();
    }

    //Obtenemos el usuario para comprobar que es el correcto
    public Optional<Usuario> obtenerUsuario(Integer id){
        return userRepository.findById(id);
    }

    //Guardamos el nuevo usuario
    public Usuario registrarUsuario(Usuario user){
        return userRepository.save(user);
    }
}*/