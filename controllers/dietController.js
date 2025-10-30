import Diet from "../models/Diet.js";
import User from "../models/User.js";

// GET /api/diets
const getDiets = async (req, res) => {
  try {
    const userId = req.user._id;
    const diets = await Diet.find({ user: userId }).sort({ createdAt: -1 });
    res.json(diets);
  } catch (err) {
    res.status(500).json({ message: "Diyetler alınamadı", error: err.message });
  }
};

// GET /api/diets/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const diets = await Diet.find({ user: userId });
    const totalDiets = diets.length;
    const activeDiets = diets.filter((d) => d.isActive).length;
    const totalCompletions = diets.reduce(
      (acc, d) => acc + (d.completionHistory?.length || 0),
      0
    );
    // Longest streak calculation (simplified: max completionHistory length)
    let longestStreak = 0;
    diets.forEach((diet) => {
      if (
        diet.completionHistory &&
        diet.completionHistory.length > longestStreak
      ) {
        longestStreak = diet.completionHistory.length;
      }
    });
    res.json({ totalDiets, activeDiets, totalCompletions, longestStreak });
  } catch (err) {
    res
      .status(500)
      .json({ message: "İstatistikler alınamadı", error: err.message });
  }
};

// POST /api/diets
const createDiet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, duration, period, customPeriod } = req.body;
    const startDate = new Date();
    const diet = new Diet({
      user: userId,
      name,
      description,
      duration,
      period,
      customPeriod,
      startDate,
      isActive: true,
      completedCount: 0,
      completionHistory: [],
    });
    await diet.save();
    res.status(201).json(diet);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Diyet oluşturulamadı", error: err.message });
  }
};

// PUT /api/diets/:id
const updateDiet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, description, duration, period, customPeriod } = req.body;
    const diet = await Diet.findOneAndUpdate(
      { _id: id, user: userId },
      { name, description, duration, period, customPeriod },
      { new: true }
    );
    if (!diet) return res.status(404).json({ message: "Diyet bulunamadı" });
    res.json(diet);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Diyet güncellenemedi", error: err.message });
  }
};

// DELETE /api/diets/:id
const deleteDiet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const diet = await Diet.findOneAndDelete({ _id: id, user: userId });
    if (!diet) return res.status(404).json({ message: "Diyet bulunamadı" });
    res.json({ message: "Diyet silindi" });
  } catch (err) {
    res.status(400).json({ message: "Diyet silinemedi", error: err.message });
  }
};

// POST /api/diets/:id/complete
const completeDiet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { notes } = req.body;
    const diet = await Diet.findOne({ _id: id, user: userId });
    if (!diet) return res.status(404).json({ message: "Diyet bulunamadı" });
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    // Check if already completed today
    const alreadyCompleted = diet.completionHistory.some((record) => {
      const recordDate = new Date(record.completedAt)
        .toISOString()
        .split("T")[0];
      return recordDate === todayStr;
    });
    if (alreadyCompleted) {
      return res.status(400).json({ message: "Bugün zaten tamamlandı" });
    }
    diet.completionHistory.push({ completedAt: today, notes });
    diet.completedCount = diet.completionHistory.length;
    await diet.save();
    res.json(diet);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Diyet tamamlanamadı", error: err.message });
  }
};

// PATCH /api/diets/:id/toggle
const toggleDiet = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const diet = await Diet.findOne({ _id: id, user: userId });
    if (!diet) return res.status(404).json({ message: "Diyet bulunamadı" });
    diet.isActive = !diet.isActive;
    await diet.save();
    res.json(diet);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Diyet durumu değiştirilemedi", error: err.message });
  }
};

export default {
  getDiets,
  getStats,
  createDiet,
  updateDiet,
  deleteDiet,
  completeDiet,
  toggleDiet,
};
