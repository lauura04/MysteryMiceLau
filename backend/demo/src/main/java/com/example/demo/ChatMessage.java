package com.example.demo;
//en el caso de nombre de usuario seria string username
public record ChatMessage(int id, String text, String userName) {

    public int getId(){
        return id;
    }

    public String getText(){
        return text;
    }

    public String getUserName(){
        return userName;
    }

}
