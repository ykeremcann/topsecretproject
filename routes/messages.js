import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
    sendMessage,
    getConversations,
    getMessages,
} from "../controllers/messageController.js";

const router = express.Router();

router.use(authenticateToken); // All routes require authentication

router.post("/send", sendMessage);
router.get("/conversations", getConversations);
router.get("/:conversationId", getMessages);

export default router;
