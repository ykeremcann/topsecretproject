import Disease from "../models/Disease.js";

// Tüm hastalıkları getir
export const getAllDiseases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { category, severity, prevalence, search, active } = req.query;

    let query = {};

    // Filtreleme
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (prevalence) query.prevalence = prevalence;
    if (active !== undefined) query.isActive = active === "true";
    else query.isActive = true; // Varsayılan olarak sadece aktif hastalıkları göster

    // Arama
    if (search) {
      query.$text = { $search: search };
    }

    const diseases = await Disease.find(query)
      .populate("createdBy", "username firstName lastName")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Disease.countDocuments(query);

    res.json({
      diseases,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDiseases: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Hastalıkları getirme hatası:", error);
    res.status(500).json({
      message: "Hastalıklar alınırken hata oluştu",
    });
  }
};

// Hastalık detayını getir
export const getDiseaseById = async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.diseaseId).populate(
      "createdBy",
      "username firstName lastName"
    );

    if (!disease) {
      return res.status(404).json({
        message: "Hastalık bulunamadı",
      });
    }

    res.json({ disease });
  } catch (error) {
    console.error("Hastalık getirme hatası:", error);
    res.status(500).json({
      message: "Hastalık bilgileri alınırken hata oluştu",
    });
  }
};

// Yeni hastalık oluştur (Admin)
export const createDisease = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      symptoms,
      commonTreatments,
      severity,
      prevalence,
      tags,
    } = req.body;

    // Aynı isimde hastalık var mı kontrol et
    const existingDisease = await Disease.findOne({ name });
    if (existingDisease) {
      return res.status(400).json({
        message: "Bu isimde bir hastalık zaten mevcut",
      });
    }

    const disease = new Disease({
      name,
      description,
      category,
      symptoms: symptoms || [],
      commonTreatments: commonTreatments || [],
      severity: severity || "medium",
      prevalence: prevalence || "common",
      tags: tags || [],
      createdBy: req.user._id,
    });

    await disease.save();

    // Populate creator bilgileri
    await disease.populate("createdBy", "username firstName lastName");

    res.status(201).json({
      message: "Hastalık başarıyla oluşturuldu",
      disease,
    });
  } catch (error) {
    console.error("Hastalık oluşturma hatası:", error);
    res.status(500).json({
      message: "Hastalık oluşturulurken hata oluştu",
    });
  }
};

// Hastalık güncelle (Admin)
export const updateDisease = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      symptoms,
      commonTreatments,
      severity,
      prevalence,
      tags,
      isActive,
    } = req.body;

    const disease = await Disease.findById(req.params.diseaseId);

    if (!disease) {
      return res.status(404).json({
        message: "Hastalık bulunamadı",
      });
    }

    // Eğer isim değişiyorsa, aynı isimde başka hastalık var mı kontrol et
    if (name && name !== disease.name) {
      const existingDisease = await Disease.findOne({ name });
      if (existingDisease) {
        return res.status(400).json({
          message: "Bu isimde bir hastalık zaten mevcut",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (symptoms) updateData.symptoms = symptoms;
    if (commonTreatments) updateData.commonTreatments = commonTreatments;
    if (severity) updateData.severity = severity;
    if (prevalence) updateData.prevalence = prevalence;
    if (tags) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDisease = await Disease.findByIdAndUpdate(
      req.params.diseaseId,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "username firstName lastName");

    res.json({
      message: "Hastalık başarıyla güncellendi",
      disease: updatedDisease,
    });
  } catch (error) {
    console.error("Hastalık güncelleme hatası:", error);
    res.status(500).json({
      message: "Hastalık güncellenirken hata oluştu",
    });
  }
};

// Hastalık sil (Admin)
export const deleteDisease = async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.diseaseId);

    if (!disease) {
      return res.status(404).json({
        message: "Hastalık bulunamadı",
      });
    }

    // Hastalığı kullanan kullanıcılar var mı kontrol et
    const User = (await import("../models/User.js")).default;
    const usersWithDisease = await User.countDocuments({
      "medicalConditions.disease": req.params.diseaseId,
    });

    if (usersWithDisease > 0) {
      return res.status(400).json({
        message: `Bu hastalık ${usersWithDisease} kullanıcı tarafından kullanılıyor. Önce hastalığı deaktif edin.`,
      });
    }

    await Disease.findByIdAndDelete(req.params.diseaseId);

    res.json({
      message: "Hastalık başarıyla silindi",
    });
  } catch (error) {
    console.error("Hastalık silme hatası:", error);
    res.status(500).json({
      message: "Hastalık silinirken hata oluştu",
    });
  }
};

// Kategori bazlı hastalık istatistikleri
export const getDiseaseStats = async (req, res) => {
  try {
    const categoryStats = await Disease.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          severityBreakdown: {
            $push: "$severity",
          },
        },
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          lowSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "low"] },
              },
            },
          },
          mediumSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "medium"] },
              },
            },
          },
          highSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "high"] },
              },
            },
          },
          criticalSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "critical"] },
              },
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const totalDiseases = await Disease.countDocuments({ isActive: true });
    const totalInactiveDiseases = await Disease.countDocuments({
      isActive: false,
    });

    res.json({
      categoryStats,
      totalDiseases,
      totalInactiveDiseases,
    });
  } catch (error) {
    console.error("Hastalık istatistikleri hatası:", error);
    res.status(500).json({
      message: "Hastalık istatistikleri alınırken hata oluştu",
    });
  }
};

// Hastalık arama
export const searchDiseases = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q) {
      return res.status(400).json({
        message: "Arama terimi gerekli",
      });
    }

    const searchRegex = new RegExp(q, "i");
    const diseases = await Disease.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
      ],
      isActive: true,
    })
      .select("name description category severity prevalence")
      .sort({ name: 1 })
      .limit(limit);

    res.json({
      diseases,
      count: diseases.length,
    });
  } catch (error) {
    console.error("Hastalık arama hatası:", error);
    res.status(500).json({
      message: "Arama sırasında hata oluştu",
    });
  }
};
