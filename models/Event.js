import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Etkinlik başlığı gerekli"],
      trim: true,
      maxlength: [200, "Başlık en fazla 200 karakter olabilir"],
    },
    description: {
      type: String,
      required: [true, "Etkinlik açıklaması gerekli"],
      maxlength: [2000, "Açıklama en fazla 2000 karakter olabilir"],
    },
    category: {
      type: String,
      required: [true, "Kategori gerekli"],
      enum: [
        "Meditasyon",
        "Yoga",
        "Beslenme",
        "Egzersiz",
        "Psikoloji",
        "Tıp",
        "Alternatif Tıp",
        "Sağlık Teknolojisi",
        "Diğer"
      ],
    },
    instructor: {
      type: String,
      required: [true, "Eğitmen adı gerekli"],
      trim: true,
      maxlength: [100, "Eğitmen adı en fazla 100 karakter olabilir"],
    },
    instructorTitle: {
      type: String,
      trim: true,
      maxlength: [100, "Eğitmen unvanı en fazla 100 karakter olabilir"],
    },
    date: {
      type: Date,
      required: [true, "Etkinlik tarihi gerekli"],
    },
    endDate: {
      type: Date,
      required: [true, "Etkinlik bitiş tarihi gerekli"],
      validate: {
        validator: function(value) {
          // Eğer date henüz set edilmemişse validasyonu geç
          if (!this.date) return true;
          return value > this.date;
        },
        message: "Bitiş tarihi başlangıç tarihinden sonra olmalı"
      }
    },
    location: {
      type: String,
      required: [true, "Etkinlik yeri gerekli"],
      trim: true,
      maxlength: [200, "Yer adı en fazla 200 karakter olabilir"],
    },
    locationAddress: {
      type: String,
      trim: true,
      maxlength: [500, "Adres en fazla 500 karakter olabilir"],
    },
    maxParticipants: {
      type: Number,
      required: [true, "Maksimum katılımcı sayısı gerekli"],
      min: [1, "En az 1 katılımcı olmalı"],
      max: [1000, "En fazla 1000 katılımcı olabilir"],
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: [0, "Katılımcı sayısı negatif olamaz"],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Fiyat negatif olamaz"],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    organizer: {
      type: String,
      required: [true, "Organizatör gerekli"],
      trim: true,
      maxlength: [200, "Organizatör adı en fazla 200 karakter olabilir"],
    },
    organizerType: {
      type: String,
      required: [true, "Organizatör tipi gerekli"],
      enum: ["government", "private", "ngo", "individual", "hospital", "university"],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, "Etiket en fazla 50 karakter olabilir"],
    }],
    requirements: {
      type: String,
      maxlength: [1000, "Gereksinimler en fazla 1000 karakter olabilir"],
    },
    image: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          // Boş string veya hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
          return !v || /^(https?:\/\/.+|\/uploads\/.+)/.test(v);
        },
        message: "Geçerli bir resim URL veya path girin",
      },
    },
    status: {
      type: String,
      enum: ["pending", "active", "full", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Etkinlik sahibi gerekli"],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Red nedeni en fazla 500 karakter olabilir"],
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      registrationDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "confirmed",
      },
      notes: {
        type: String,
        maxlength: [500, "Notlar en fazla 500 karakter olabilir"],
      },
    }],
    reports: [{
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      reason: {
        type: String,
        enum: ["spam", "inappropriate", "false_information", "other"],
        required: true,
      },
      description: {
        type: String,
        maxlength: [500, "Rapor açıklaması en fazla 500 karakter olabilir"],
      },
      reportedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["pending", "reviewed", "resolved"],
        default: "pending",
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Virtual field for publish date
eventSchema.virtual("publishDate").get(function () {
  return this.createdAt;
});

// Virtual field for checking if event is full
eventSchema.virtual("isFull").get(function () {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual field for checking if event is past
eventSchema.virtual("isPast").get(function () {
  return new Date() > this.endDate;
});

// Virtual field for checking if event is upcoming
eventSchema.virtual("isUpcoming").get(function () {
  return new Date() < this.date;
});

// Virtual field for checking if event is ongoing
eventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return now >= this.date && now <= this.endDate;
});

// Pre-save middleware to update currentParticipants
eventSchema.pre("save", function(next) {
  if (this.participants) {
    this.currentParticipants = this.participants.filter(
      p => p.status === "confirmed"
    ).length;
  }
  next();
});

// Method to check if user is registered
eventSchema.methods.isUserRegistered = function(userId) {
  return this.participants.some(
    p => p.user.toString() === userId.toString() && p.status === "confirmed"
  );
};

// Method to add participant
eventSchema.methods.addParticipant = function(userId, notes = "") {
  if (this.isFull) {
    throw new Error("Etkinlik kontenjanı dolu");
  }
  
  if (this.isUserRegistered(userId)) {
    throw new Error("Kullanıcı zaten kayıtlı");
  }

  this.participants.push({
    user: userId,
    notes: notes,
    status: "confirmed"
  });
  
  return this.save();
};

// Method to remove participant
eventSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(
    p => p.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to approve event
eventSchema.methods.approve = function(adminId) {
  this.status = "active";
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.rejectionReason = undefined;
  
  return this.save();
};

// Method to reject event
eventSchema.methods.reject = function(adminId, reason) {
  this.status = "rejected";
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  
  return this.save();
};

// Method to add report
eventSchema.methods.addReport = function(userId, reason, description) {
  this.reports.push({
    reportedBy: userId,
    reason: reason,
    description: description
  });
  
  return this.save();
};

// Pre-save middleware - tarih validasyonu
eventSchema.pre("save", function(next) {
  if (this.date && this.endDate && this.endDate <= this.date) {
    const error = new Error("Bitiş tarihi başlangıç tarihinden sonra olmalı");
    error.name = "ValidationError";
    return next(error);
  }
  next();
});

// Pre-update middleware - tarih validasyonu
eventSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function(next) {
  const update = this.getUpdate();
  
  // Eğer hem date hem endDate güncelleniyorsa
  if (update.date && update.endDate) {
    if (new Date(update.endDate) <= new Date(update.date)) {
      const error = new Error("Bitiş tarihi başlangıç tarihinden sonra olmalı");
      error.name = "ValidationError";
      return next(error);
    }
  }
  
  // Eğer sadece endDate güncelleniyorsa ve date mevcutsa
  if (update.endDate && !update.date) {
    this.model.findOne(this.getQuery()).then(doc => {
      if (doc && new Date(update.endDate) <= doc.date) {
        const error = new Error("Bitiş tarihi başlangıç tarihinden sonra olmalı");
        error.name = "ValidationError";
        return next(error);
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Index'ler
eventSchema.index({ title: "text", description: "text" });
eventSchema.index({ category: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ authorId: 1 });
eventSchema.index({ organizerType: 1 });
eventSchema.index({ isOnline: 1 });
eventSchema.index({ "participants.user": 1 });

const Event = mongoose.model("Event", eventSchema);

export default Event;
