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
      enum: ["patient", "admin"],
      default: "patient",
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
    medicalConditions: [
      {
        disease: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Disease",
          required: true,
        },
        diagnosisDate: {
          type: Date,
        },
        notes: {
          type: String,
          maxlength: [500, "Notlar en fazla 500 karakter olabilir"],
        },
      },
    ],
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
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
