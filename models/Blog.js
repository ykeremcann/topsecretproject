import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
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
      maxlength: [10000, "İçerik en fazla 10000 karakter olabilir"],
    },
    excerpt: {
      type: String,
      maxlength: [500, "Özet en fazla 500 karakter olabilir"],
    },
    category: {
      type: String,
      required: [true, "Kategori gerekli"],
      enum: [
        "medical-advice",
        "health-tips",
        "disease-information",
        "treatment-guides",
        "prevention",
        "nutrition",
        "mental-health",
        "pediatrics",
        "geriatrics",
        "emergency-care",
        "research",
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
            return /^https?:\/\/.+/.test(v);
          },
          message: "Geçerli bir URL girin",
        },
      },
    ],
    featuredImage: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Geçerli bir URL girin",
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    readingTime: {
      type: Number, // dakika cinsinden
      default: 0,
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
    commentCount: {
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
    medicalDisclaimer: {
      type: String,
      maxlength: [1000, "Tıbbi uyarı en fazla 1000 karakter olabilir"],
      default: "Bu içerik sadece bilgilendirme amaçlıdır ve profesyonel tıbbi tavsiye yerine geçmez. Sağlık sorunlarınız için mutlaka bir doktora başvurunuz.",
    },
    references: [
      {
        title: {
          type: String,
          maxlength: [200, "Referans başlığı en fazla 200 karakter olabilir"],
        },
        url: {
          type: String,
          validate: {
            validator: function (v) {
              return !v || /^https?:\/\/.+/.test(v);
            },
            message: "Geçerli bir URL girin",
          },
        },
      },
    ],
    seoTitle: {
      type: String,
      maxlength: [60, "SEO başlığı en fazla 60 karakter olabilir"],
    },
    seoDescription: {
      type: String,
      maxlength: [160, "SEO açıklaması en fazla 160 karakter olabilir"],
    },
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
blogSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

// Virtual field for dislike count
blogSchema.virtual("dislikesCount").get(function () {
  return this.dislikes.length;
});

// Comment count artırma metodu
blogSchema.methods.incrementCommentCount = function () {
  this.commentCount += 1;
  return this.save();
};

// Comment count azaltma metodu
blogSchema.methods.decrementCommentCount = function () {
  this.commentCount = Math.max(0, this.commentCount - 1);
  return this.save();
};

// Virtual field'ları JSON'a dahil et
blogSchema.set('toJSON', { virtuals: true });
blogSchema.set('toObject', { virtuals: true });

// Slug oluşturma middleware
blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Okuma süresi hesaplama middleware
blogSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200; // Ortalama okuma hızı
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

// Index'ler
blogSchema.index({ author: 1, createdAt: -1 });
blogSchema.index({ category: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ isPublished: 1, isApproved: 1, createdAt: -1 });
blogSchema.index({ isFeatured: 1, createdAt: -1 });
blogSchema.index({ title: "text", content: "text", excerpt: "text" });
blogSchema.index({ slug: 1 });

// Middleware to update view count
blogSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Middleware to handle likes/dislikes
blogSchema.methods.toggleLike = function (userId) {
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

blogSchema.methods.toggleDislike = function (userId) {
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

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
