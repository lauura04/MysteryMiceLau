package com.example.demo;
//en el caso de nombre de usuario seria string username
public record ChatMessage(int id, int userId, String userName,String text) {

    public int getId(){
        return id;
    }

    public String getText(){
        return text;
    }

    public int getUserId(){
        return userId;
    }

    public String getUserName(){
        return userName;
    }

}
