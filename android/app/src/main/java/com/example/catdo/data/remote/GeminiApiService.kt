package com.example.catdo.data.remote

import com.example.catdo.model.CustomCatAppearance
import com.example.catdo.model.TaskAnalysis
import com.example.catdo.model.TaskCategory
import com.example.catdo.model.TaskDifficulty
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

class GeminiApiService(private val apiKey: String? = null) {

    private val generativeModel by lazy {
        GenerativeModel(
            modelName = "gemini-2.5-flash",
            apiKey = apiKey ?: ""
        )
    }

    suspend fun analyzeTaskEffort(
        title: String,
        detail: String? = null,
        category: TaskCategory = TaskCategory.LIFE
    ): TaskAnalysis = withContext(Dispatchers.IO) {
        if (apiKey.isNullOrBlank()) {
            return@withContext getLocalFallbackAnalysis(title, category)
        }

        try {
            val prompt = """
                당신은 귀여운 반려묘와 함께하는 힐링 투두 앱의 따뜻한 안내자입니다.
                할일: "$title", 상세: "${detail ?: ""}", 카테고리: "${category.id}"
                
                기계적인 AI 말투나 '인지적 집중', '유의미한 과업' 등의 단어를 절대로 쓰지 말고,
                친근하고 따뜻한 어조로 다음 JSON으로만 응답하세요:
                {
                  "difficulty": "easy | medium | hard | extreme",
                  "difficultyLabel": "가벼운 몸풀기 | 집중 몰입 | 도전 과제 | 대단한 챌린지",
                  "effortValue": 10부터 150 사이 정수,
                  "rationale": "집사의 노력을 응원하고 공감해주는 1-2문장",
                  "catComment": "고양이가 귀엽게 건네는 응원 한마디 (~다냥 / ~라옹)",
                  "suggestedPacing": "현실적인 1줄 휴식 팁"
                }
            """.trimIndent()

            val response = generativeModel.generateContent(prompt)
            val jsonText = response.text?.replace("```json", "")?.replace("```", "")?.trim() ?: "{}"
            val obj = JSONObject(jsonText)

            val diffStr = obj.optString("difficulty", "medium")
            val diff = TaskDifficulty.entries.find { it.id == diffStr } ?: TaskDifficulty.MEDIUM

            TaskAnalysis(
                difficulty = diff,
                difficultyLabel = obj.optString("difficultyLabel", diff.label),
                effortValue = obj.optInt("effortValue", 40).coerceIn(10, 150),
                rationale = obj.optString("rationale", "차분한 집중과 정성이 담긴 의미 있는 시간이에요."),
                catComment = obj.optString("catComment", "집사야 힘내라옹! 끝나면 맛난 참치캔 먹자냥! 🐟"),
                suggestedPacing = obj.optString("suggestedPacing", "적절한 스트레칭과 함께 진행해 보세요.")
            )
        } catch (e: Exception) {
            getLocalFallbackAnalysis(title, category)
        }
    }

    private fun getLocalFallbackAnalysis(title: String, category: TaskCategory): TaskAnalysis {
        val score = when (category) {
            TaskCategory.STUDY, TaskCategory.WORK -> 50
            TaskCategory.HEALTH -> 35
            TaskCategory.LIFE -> 30
            TaskCategory.HOBBY -> 25
        }
        return TaskAnalysis(
            difficulty = TaskDifficulty.MEDIUM,
            difficultyLabel = "집중 몰입",
            effortValue = score,
            rationale = "차분한 집중과 정성이 담긴 의미 있는 시간이에요.",
            catComment = "집사야 힘내라옹! 끝나면 맛난 참치캔 먹자냥! 🐟",
            suggestedPacing = "25분 몰입 후 5분 먼 곳을 바라보며 눈을 쉬어주세요."
        )
    }
}
