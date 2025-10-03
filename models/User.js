import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Kullanıcı adı gerekli"],
      unique: true,
      trim: true,
      minlength: [3, "Kullanıcı adı en az 3 karakter olmalı"],
      maxlength: [30, "Kullanıcı adı en fazla 30 karakter olabilir"],
    },
    email: {
      type: String,
      required: [true, "Email gerekli"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Geçerli bir email adresi girin",
      ],
    },
    password: {
      type: String,
      required: [true, "Şifre gerekli"],
      minlength: [6, "Şifre en az 6 karakter olmalı"],
    },
    firstName: {
      type: String,
      required: [true, "Ad gerekli"],
      trim: true,
      maxlength: [50, "Ad en fazla 50 karakter olabilir"],
    },
    lastName: {
      type: String,
      required: [true, "Soyad gerekli"],
      trim: true,
      maxlength: [50, "Soyad en fazla 50 karakter olabilir"],
    },
    role: {
      type: String,
      enum: ["patient", "admin", "doctor"],
      default: "patient",
    },
    // Doktor bilgileri (sadece doktorlar için)
    doctorInfo: {
      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      approvalDate: {
        type: Date,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      rejectionReason: {
        type: String,
        maxlength: [500, "Red sebebi en fazla 500 karakter olabilir"],
      },
      location: {
        type: String,
        maxlength: [100, "Lokasyon en fazla 100 karakter olabilir"],
      },
      specialization: {
        type: String,
        maxlength: [100, "Uzmanlık alanı en fazla 100 karakter olabilir"],
      },
      hospital: {
        type: String,
        maxlength: [100, "Hastane adı en fazla 100 karakter olabilir"],
      },
      experience: {
        type: Number,
        min: [0, "Deneyim yılı 0'dan küçük olamaz"],
        max: [50, "Deneyim yılı 50'den büyük olamaz"],
      },
    },
    profilePicture: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: [500, "Biyografi en fazla 500 karakter olabilir"],
      default: "",
    },
    dateOfBirth: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Şifre hash'leme middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Role değişikliği middleware
userSchema.pre("save", async function (next) {
  // Eğer role doctor olarak değiştiriliyorsa
  if (this.isModified("role") && this.role === "doctor") {
    // Doctor info'yu başlat
    if (!this.doctorInfo) {
      this.doctorInfo = {};
    }
    this.doctorInfo.approvalStatus = "pending";
  }
  
  // Eğer role patient veya admin olarak değiştiriliyorsa
  if (this.isModified("role") && (this.role === "patient" || this.role === "admin")) {
    // Doctor info'yu temizle
    this.doctorInfo = undefined;
  }
  
  next();
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Kullanıcı bilgilerini JSON'a çevirirken şifreyi çıkar
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Virtual field for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index'ler
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
