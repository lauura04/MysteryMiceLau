package com.example.demo;

import java.io.BufferedReader;
import java.io.File;

import java.io.FileReader;

public class LoginUtils {
    public static boolean usuarioExiste(int userId)
    {
        File archivo = new File("usuarios/usuarios.txt");
        if(!archivo.exists()) return false;

        try(BufferedReader reader = new BufferedReader(new FileReader(archivo))){
            String linea;
            while((linea=reader.readLine())!=null){
                String[] partes = linea.split(",");
                if(partes.length>=1 && partes[0].equals(String.valueOf(userId))){
                    return true;
                }
            }
        } catch(Exception e){
            e.printStackTrace();
        }
        return false;
    }

}
