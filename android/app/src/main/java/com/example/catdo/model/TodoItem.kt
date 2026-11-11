package com.example.catdo.model

enum class TaskCategory(val id: String, val label: String, val icon: String) {
    STUDY("study", "공부", "📚"),
    WORK("work", "업무", "💼"),
    HEALTH("health", "운동", "🏃"),
    LIFE("life", "일상", "🧹"),
    HOBBY("hobby", "취미", "🎨")
}

enum class TaskDifficulty(val id: String, val label: String) {
    EASY("easy", "가벼운 몸풀기"),
    MEDIUM("medium", "집중 몰입"),
    HARD("hard", "도전 과제"),
    EXTREME("extreme", "대단한 챌린지")
}

data class TaskAnalysis(
    val difficulty: TaskDifficulty = TaskDifficulty.MEDIUM,
    val difficultyLabel: String = "집중 몰입",
    val effortValue: Int = 40,
    val rationale: String = "차분한 집중과 정성이 담긴 의미 있는 시간이에요.",
    val catComment: String = "집사야 힘내라옹! 끝나면 맛난 참치캔 먹자냥! 🐟",
    val suggestedPacing: String? = "적절한 스트레칭과 수분 섭취를 잊지 마세요."
)

data class TodoItem(
    val id: String,
    val title: String,
    val detail: String? = null,
    val category: TaskCategory = TaskCategory.LIFE,
    val isImportant: Boolean = false,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null,
    val analysis: TaskAnalysis = TaskAnalysis()
) {
    val categoryLabel: String get() = category.label
    val difficultyLabel: String get() = analysis.difficultyLabel
    val rewardCoins: Int get() = analysis.effortValue
}
