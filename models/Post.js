import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      required: [true, "Kategori gerekli"],
      enum: [
        "diabetes",
        "heart-disease",
        "cancer",
        "mental-health",
        "arthritis",
        "asthma",
        "digestive",
        "neurological",
        "autoimmune",
        "success-story",
        "other",
      ],
    },
    tags: [
      {
        type: String,
        maxlength: [50, "Etiket en fazla 50 karakter olabilir"],
      },
    ],
    images: [
      {
        type: String,
        validate: {
          validator: function (v) {
            // Hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
            return /^(https?:\/\/.+|\/uploads\/.+)/.test(v);
          },
          message: "Geçerli bir resim URL veya path girin",
        },
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isSensitive: {
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
    views: {
      type: Number,
      default: 0,
    },
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
    medicalAdvice: {
      type: Boolean,
      default: false,
    },
    symptoms: [
      {
        type: String,
        maxlength: [100, "Semptom adı en fazla 100 karakter olabilir"],
      },
    ],
    treatments: [
      {
        type: String,
        maxlength: [200, "Tedavi adı en fazla 200 karakter olabilir"],
      },
    ],
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);


// Virtual field for like count
postSchema.virtual("likeCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual field for dislike count
postSchema.virtual("dislikeCount").get(function () {
  return this.dislikes ? this.dislikes.length : 0;
});

// Virtual field for comment count (will be populated from Comment model)
postSchema.virtual("commentCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  count: true,
});

// Virtual alanların JSON ve object çıktısında görünmesi için ayar
postSchema.set('toObject', { virtuals: true });
postSchema.set('toJSON', { virtuals: true });

// Slug oluşturma middleware
postSchema.pre('save', async function (next) {
  if (this.isModified('title') && !this.slug) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Aynı slug varsa sonuna sayı ekle
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingPost = await mongoose.model('Post').findOne({ slug: slug });
      if (!existingPost || existingPost._id.toString() === this._id.toString()) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Index'ler
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ isApproved: 1, createdAt: -1 });
postSchema.index({ title: "text", content: "text" });
postSchema.index({ slug: 1 }); // slug index'i eklendi

// Middleware to update view count
postSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Middleware to handle likes/dislikes
postSchema.methods.toggleLike = function (userId) {
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

postSchema.methods.toggleDislike = function (userId) {
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

const Post = mongoose.model("Post", postSchema);

export default Post;
