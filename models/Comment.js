import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postOrBlog: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    postType: {
      type: String,
      enum: ["Post", "Blog", "EventPost"],
      required: true,
      default: "Post",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Yorum içeriği gerekli"],
      maxlength: [1000, "Yorum en fazla 1000 karakter olabilir"],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
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
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    isHelpful: {
      type: Boolean,
      default: false,
    },
    medicalAdvice: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for like count
commentSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual field for dislike count
commentSchema.virtual("dislikeCount").get(function () {
  return this.dislikes ? this.dislikes.length : 0;
});

// Virtual field for reply count
commentSchema.virtual("replyCount").get(function () {
  return this.replies ? this.replies.length : 0;
});

// Index'ler
commentSchema.index({ postOrBlog: 1, postType: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isApproved: 1 });
commentSchema.index({ postType: 1 });

// Middleware to handle likes/dislikes
commentSchema.methods.toggleLike = function (userId) {
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

commentSchema.methods.toggleDislike = function (userId) {
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

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
