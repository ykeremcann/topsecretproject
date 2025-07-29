import mongoose from "mongoose";

const diseaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hastalık adı gerekli"],
      trim: true,
      unique: true,
      maxlength: [100, "Hastalık adı en fazla 100 karakter olabilir"],
    },
    description: {
      type: String,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir"],
      default: "",
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
        "other",
      ],
    },
    symptoms: [
      {
        type: String,
        maxlength: [100, "Semptom en fazla 100 karakter olabilir"],
      },
    ],
    commonTreatments: [
      {
        type: String,
        maxlength: [200, "Tedavi en fazla 200 karakter olabilir"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    prevalence: {
      type: String,
      enum: ["rare", "uncommon", "common", "very-common"],
      default: "common",
    },
    tags: [
      {
        type: String,
        maxlength: [50, "Etiket en fazla 50 karakter olabilir"],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index'ler
diseaseSchema.index({ name: "text", description: "text" });
diseaseSchema.index({ category: 1, isActive: 1 });
diseaseSchema.index({ severity: 1 });
diseaseSchema.index({ prevalence: 1 });

const Disease = mongoose.model("Disease", diseaseSchema);

export default Disease;
