import User from "../models/User.js";

// Tüm kullanıcıları getir (admin için)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select("-password")
      .populate("medicalConditions.disease", "name category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({});

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Kullanıcıları getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcılar alınırken hata oluştu",
    });
  }
};

// Kullanıcı detayını getir
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("followers", "username firstName lastName profilePicture")
      .populate("following", "username firstName lastName profilePicture")
      .populate(
        "medicalConditions.disease",
        "name description category severity"
      );

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Kullanıcı getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcı bilgileri alınırken hata oluştu",
    });
  }
};

// Kullanıcı güncelle
export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, bio, dateOfBirth, profilePicture } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate(
        "medicalConditions.disease",
        "name description category severity"
      );

    res.json({
      message: "Profil başarıyla güncellendi",
      user,
    });
  } catch (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    res.status(500).json({
      message: "Profil güncellenirken hata oluştu",
    });
  }
};

// Kullanıcıya hastalık ekle
export const addMedicalCondition = async (req, res) => {
  try {
    const { diseaseId, diagnosisDate, notes } = req.body;

    // Hastalığın var olduğunu kontrol et
    const Disease = (await import("../models/Disease.js")).default;
    const disease = await Disease.findById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        message: "Hastalık bulunamadı",
      });
    }

    const user = await User.findById(req.user._id);

    // Aynı hastalığın zaten ekli olup olmadığını kontrol et
    const existingCondition = user.medicalConditions.find(
      (condition) => condition.disease.toString() === diseaseId
    );

    if (existingCondition) {
      return res.status(400).json({
        message: "Bu hastalık zaten ekli",
      });
    }

    user.medicalConditions.push({
      disease: diseaseId,
      diagnosisDate: diagnosisDate || null,
      notes: notes || "",
    });

    await user.save();

    // Populate disease bilgileri
    await user.populate(
      "medicalConditions.disease",
      "name description category severity"
    );

    res.json({
      message: "Hastalık başarıyla eklendi",
      medicalConditions: user.medicalConditions,
    });
  } catch (error) {
    console.error("Hastalık ekleme hatası:", error);
    res.status(500).json({
      message: "Hastalık eklenirken hata oluştu",
    });
  }
};

// Kullanıcıdan hastalık çıkar
export const removeMedicalCondition = async (req, res) => {
  try {
    const { conditionId } = req.params;

    const user = await User.findById(req.user._id);

    const conditionIndex = user.medicalConditions.findIndex(
      (condition) => condition._id.toString() === conditionId
    );

    if (conditionIndex === -1) {
      return res.status(404).json({
        message: "Hastalık bulunamadı",
      });
    }

    user.medicalConditions.splice(conditionIndex, 1);
    await user.save();

    // Populate disease bilgileri
    await user.populate(
      "medicalConditions.disease",
      "name description category severity"
    );

    res.json({
      message: "Hastalık başarıyla çıkarıldı",
      medicalConditions: user.medicalConditions,
    });
  } catch (error) {
    console.error("Hastalık çıkarma hatası:", error);
    res.status(500).json({
      message: "Hastalık çıkarılırken hata oluştu",
    });
  }
};

// Kullanıcı takip et/takibi bırak
export const toggleFollow = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: "Kendinizi takip edemezsiniz",
      });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(userId);

    if (isFollowing) {
      // Takibi bırak
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $pull: { followers: req.user._id },
      });

      res.json({
        message: "Takip bırakıldı",
        isFollowing: false,
      });
    } else {
      // Takip et
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: userId },
      });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { followers: req.user._id },
      });

      res.json({
        message: "Takip edildi",
        isFollowing: true,
      });
    }
  } catch (error) {
    console.error("Takip işlemi hatası:", error);
    res.status(500).json({
      message: "Takip işlemi sırasında hata oluştu",
    });
  }
};

// Kullanıcı arama
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        message: "Arama terimi gerekli",
      });
    }

    const searchRegex = new RegExp(q, "i");
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { bio: searchRegex },
      ],
      isActive: true,
    })
      .select("-password")
      .sort({ username: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { bio: searchRegex },
      ],
      isActive: true,
    });

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Kullanıcı arama hatası:", error);
    res.status(500).json({
      message: "Arama sırasında hata oluştu",
    });
  }
};

// Kullanıcı istatistikleri
export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const user = await User.findById(userId).select(
      "followers following createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    // Post sayısını al (Post modeli import edilmeli)
    // const postCount = await Post.countDocuments({ author: userId });

    res.json({
      stats: {
        followers: user.followers.length,
        following: user.following.length,
        // posts: postCount,
        memberSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error("İstatistik getirme hatası:", error);
    res.status(500).json({
      message: "İstatistikler alınırken hata oluştu",
    });
  }
};
