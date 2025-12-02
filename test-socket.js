import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const socket = io(SOCKET_URL);

socket.on("connect", () => {
    console.log("Connected to server with ID:", socket.id);

    // Simulate joining a room (replace with a real user ID if testing with DB)
    const userId = "test-user-id";
    socket.emit("join", userId);
});

socket.on("receive_message", (message) => {
    console.log("Received message:", message);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

// Keep the script running
setInterval(() => { }, 1000);
