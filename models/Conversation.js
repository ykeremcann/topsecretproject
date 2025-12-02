import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique participants combination
// conversationSchema.index({ participants: 1 }, { unique: true }); // This might be tricky with array order, handling in controller is safer or using a sorted string hash

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
