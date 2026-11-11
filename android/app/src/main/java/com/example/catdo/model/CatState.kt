package com.example.catdo.model

enum class CatBreed(
    val id: String,
    val displayName: String,
    val primaryColorHex: String,
    val description: String
) {
    CHEESE("cheese", "치즈 태비", "#F59E0B", "노릇노릇 따뜻한 치즈 줄무늬 냥이"),
    MACKEREL("mackerel", "고등어 태비", "#6B7280", "호기심 많고 날렵한 야생의 고등어 냥이"),
    TUXEDO("tuxedo", "턱시도", "#18181B", "단정한 검은 연미복과 흰 양말을 신은 냥이"),
    CALICO("calico", "삼색이", "#FAFAF9", "다정한 색채와 사랑스러운 매력의 삼색 냥이"),
    WHITE("white", "스노우 화이트", "#FFFFFF", "눈송이처럼 새하얗고 우아한 냥이"),
    CUSTOM("custom", "나만의 맞춤 냥이", "#F59E0B", "실제 사진을 바탕으로 생성된 1:1 커스텀 냥이")
}

enum class CatPersonality(val id: String, val label: String) {
    FOODIE("foodie", "🐟 츄르에 진심인 먹보"),
    ENERGETIC("energetic", "⚡ 파이팅 넘치는 에너자이저"),
    CUDDLY("cuddly", "💕 골골송 부르는 애교쟁이"),
    ZEN("zen", "🧘 도도하고 시크한 관찰자")
}

data class CustomCatAppearance(
    val primaryColor: String = "#F59E0B",
    val stripeColor: String? = "#D97706",
    val bellyColor: String = "#FFFFFF",
    val eyeColorLeft: String = "#10B981",
    val eyeColorRight: String = "#10B981",
    val noseColor: String = "#F43F5E",
    val hasStripes: Boolean = true,
    val hasBib: Boolean = true,
    val hasSocks: Boolean = true,
    val hasBlush: Boolean = true,
    val breedTag: String? = null,
    val aiDescription: String? = null,
    val sourcePhotoPath: String? = null
)

data class CatState(
    val id: String = "cat_default",
    val name: String = "치즈",
    val breed: CatBreed = CatBreed.CHEESE,
    val personality: CatPersonality = CatPersonality.FOODIE,
    val level: Int = 1,
    val exp: Int = 0,
    val expToNext: Int = 100,
    val fullness: Int = 60, // 0 to 100
    val happiness: Int = 80, // 0 to 100
    val coins: Int = 50,
    val accessory: String = "none",
    val currentAnimation: String = "idle",
    val totalTasksCompleted: Int = 0,
    val likesCount: Int = 0,
    val kindnessKarma: Int = 0,
    val interests: List<String> = listOf("#성실집사", "#고양이사랑"),
    val customAppearance: CustomCatAppearance? = null
) {
    val isHungry: Boolean get() = fullness <= 30
}
