import Diet from "../models/Diet.js";
import User from "../models/User.js";
import { validationResult } from "express-validator";

// Tüm diyetleri getir (filtreleme ve sayfalama ile)
export const getAllDiets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const userId = req.user.id;
    const query = { user: userId };
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const diets = await Diet.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("user", "firstName lastName email");

    const total = await Diet.countDocuments(query);

    res.status(200).json({
      success: true,
      data: diets,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
      },
    });
  } catch (error) {
    console.error("Diyetleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyetler getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Tek diyet getir
export const getDietById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const diet = await Diet.findOne({ _id: id, user: userId }).populate(
      "user",
      "firstName lastName email"
    );
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diyet bulunamadı",
      });
    }
    res.status(200).json({
      success: true,
      data: diet,
    });
  } catch (error) {
    console.error("Diyet getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet getirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Yeni diyet oluştur
export const createDiet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veri",
        errors: errors.array(),
      });
    }
    const { name, description, duration, period, customPeriod, startDate } =
      req.body;
    const userId = req.user.id;
    if (period === "custom" && !customPeriod) {
      return res.status(400).json({
        success: false,
        message: "Özel periyot seçildi ancak customPeriod girilmedi",
      });
    }
    const dietData = {
      user: userId,
      name,
      description,
      duration,
      period,
      startDate,
    };
    if (period === "custom") {
      dietData.customPeriod = customPeriod;
    }
    const diet = new Diet(dietData);
    await diet.save();
    await diet.populate("user", "firstName lastName email");
    res.status(201).json({
      success: true,
      message: "Diyet başarıyla oluşturuldu",
      data: diet,
    });
  } catch (error) {
    console.error("Diyet oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet oluşturulurken hata oluştu",
      error: error.message,
    });
  }
};

// Diyet güncelle
export const updateDiet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veri",
        errors: errors.array(),
      });
    }
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    if (updateData.period === "custom" && !updateData.customPeriod) {
      return res.status(400).json({
        success: false,
        message: "Özel periyot seçildi ancak customPeriod girilmedi",
      });
    }
    const diet = await Diet.findOneAndUpdate(
      { _id: id, user: userId },
      updateData,
      { new: true, runValidators: true }
    ).populate("user", "firstName lastName email");
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diyet bulunamadı",
      });
    }
    res.status(200).json({
      success: true,
      message: "Diyet başarıyla güncellendi",
      data: diet,
    });
  } catch (error) {
    console.error("Diyet güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet güncellenirken hata oluştu",
      error: error.message,
    });
  }
};

// Diyet sil
export const deleteDiet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const diet = await Diet.findOneAndDelete({ _id: id, user: userId });
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diyet bulunamadı",
      });
    }
    res.status(200).json({
      success: true,
      message: "Diyet başarıyla silindi",
    });
  } catch (error) {
    console.error("Diyet silme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet silinirken hata oluştu",
      error: error.message,
    });
  }
};

// Diyeti tamamla
export const completeDiet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veri",
        errors: errors.array(),
      });
    }
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;
    const diet = await Diet.findOne({ _id: id, user: userId });
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diyet bulunamadı",
      });
    }
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const alreadyCompleted = diet.completionHistory.some((record) => {
      const recordDate = new Date(record.completedAt)
        .toISOString()
        .split("T")[0];
      return recordDate === todayStr;
    });
    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "Bugün zaten tamamlandı",
      });
    }
    diet.completionHistory.push({ completedAt: today, notes });
    diet.completedCount = diet.completionHistory.length;
    await diet.save();
    res.status(200).json({
      success: true,
      message: "Diyet başarıyla tamamlandı",
      data: diet,
    });
  } catch (error) {
    console.error("Diyet tamamlama hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet tamamlanırken hata oluştu",
      error: error.message,
    });
  }
};

// Diyet durumunu değiştir (aktif/pasif)
export const toggleDietStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const diet = await Diet.findOne({ _id: id, user: userId });
    if (!diet) {
      return res.status(404).json({
        success: false,
        message: "Diyet bulunamadı",
      });
    }
    diet.isActive = !diet.isActive;
    await diet.save();
    res.status(200).json({
      success: true,
      message: `Diyet ${diet.isActive ? "aktif" : "pasif"} hale getirildi`,
      data: diet,
    });
  } catch (error) {
    console.error("Diyet durumu değiştirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet durumu değiştirilirken hata oluştu",
      error: error.message,
    });
  }
};

// Kullanıcı diyet istatistiklerini getir
export const getUserDietStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const diets = await Diet.find({ user: userId });
    const stats = {
      totalDiets: diets.length,
      activeDiets: diets.filter((d) => d.isActive).length,
      totalCompletions: diets.reduce(
        (acc, d) => acc + (d.completionHistory?.length || 0),
        0
      ),
      longestStreak: 0,
    };
    diets.forEach((diet) => {
      if (
        diet.completionHistory &&
        diet.completionHistory.length > stats.longestStreak
      ) {
        stats.longestStreak = diet.completionHistory.length;
      }
    });
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Diyet istatistikleri getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Diyet istatistikleri getirilirken hata oluştu",
      error: error.message,
    });
  }
};
