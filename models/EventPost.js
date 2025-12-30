import mongoose from "mongoose";

const eventPostSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Başlık gerekli"],
            trim: true,
            maxlength: [200, "Başlık en fazla 200 karakter olabilir"],
        },
        content: {
            type: String,
            required: [true, "İçerik gerekli"],
            maxlength: [5000, "İçerik en fazla 5000 karakter olabilir"],
        },
        images: [
            {
                type: String,
                validate: {
                    validator: function (v) {
                        return /^(https?:\/\/.+|\/uploads\/.+)/.test(v);
                    },
                    message: "Geçerli bir resim URL veya path girin",
                },
            },
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        dislikes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isApproved: {
            type: Boolean,
            default: true,
        },
        isReported: {
            type: Boolean,
            default: false,
        },
        reportCount: {
            type: Number,
            default: 0,
        },
        reports: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                reason: {
                    type: String,
                    required: true,
                    enum: [
                        "spam",
                        "inappropriate",
                        "harassment",
                        "false_information",
                        "other",
                    ],
                },
                description: {
                    type: String,
                    maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
                },
                reportedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Virtual field for like count
eventPostSchema.virtual("likeCount").get(function () {
    return this.likes ? this.likes.length : 0;
});

// Virtual field for dislike count
eventPostSchema.virtual("dislikeCount").get(function () {
    return this.dislikes ? this.dislikes.length : 0;
});

eventPostSchema.set("toObject", { virtuals: true });
eventPostSchema.set("toJSON", { virtuals: true });

// Middleware to handle likes/dislikes
eventPostSchema.methods.toggleLike = function (userId) {
    const likeIndex = this.likes.indexOf(userId);
    const dislikeIndex = this.dislikes.indexOf(userId);

    if (likeIndex > -1) {
        this.likes.splice(likeIndex, 1);
    } else {
        this.likes.push(userId);
        if (dislikeIndex > -1) {
            this.dislikes.splice(dislikeIndex, 1);
        }
    }

    return this.save();
};

eventPostSchema.methods.toggleDislike = function (userId) {
    const likeIndex = this.likes.indexOf(userId);
    const dislikeIndex = this.dislikes.indexOf(userId);

    if (dislikeIndex > -1) {
        this.dislikes.splice(dislikeIndex, 1);
    } else {
        this.dislikes.push(userId);
        if (likeIndex > -1) {
            this.likes.splice(likeIndex, 1);
        }
    }

    return this.save();
};

const EventPost = mongoose.model("EventPost", eventPostSchema);

export default EventPost;
