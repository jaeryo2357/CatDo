package com.example.catdo.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.catdo.model.TaskCategory
import com.example.catdo.model.TaskDifficulty
import com.example.catdo.model.TaskAnalysis
import com.example.catdo.model.TodoItem

@Entity(tableName = "todos")
data class TodoEntity(
    @PrimaryKey val id: String,
    val title: String,
    val detail: String?,
    val category: String,
    val isImportant: Boolean,
    val isCompleted: Boolean,
    val createdAt: Long,
    val completedAt: Long?,
    val difficulty: String,
    val difficultyLabel: String,
    val effortValue: Int,
    val rationale: String,
    val catComment: String,
    val suggestedPacing: String?
) {
    fun toDomainModel(): TodoItem {
        val catEnum = TaskCategory.entries.find { it.id == category } ?: TaskCategory.LIFE
        val diffEnum = TaskDifficulty.entries.find { it.id == difficulty } ?: TaskDifficulty.MEDIUM
        return TodoItem(
            id = id,
            title = title,
            detail = detail,
            category = catEnum,
            isImportant = isImportant,
            isCompleted = isCompleted,
            createdAt = createdAt,
            completedAt = completedAt,
            analysis = TaskAnalysis(
                difficulty = diffEnum,
                difficultyLabel = difficultyLabel,
                effortValue = effortValue,
                rationale = rationale,
                catComment = catComment,
                suggestedPacing = suggestedPacing
            )
        )
    }

    companion object {
        fun fromDomainModel(item: TodoItem): TodoEntity {
            return TodoEntity(
                id = item.id,
                title = item.title,
                detail = item.detail,
                category = item.category.id,
                isImportant = item.isImportant,
                isCompleted = item.isCompleted,
                createdAt = item.createdAt,
                completedAt = item.completedAt,
                difficulty = item.analysis.difficulty.id,
                difficultyLabel = item.analysis.difficultyLabel,
                effortValue = item.analysis.effortValue,
                rationale = item.analysis.rationale,
                catComment = item.analysis.catComment,
                suggestedPacing = item.analysis.suggestedPacing
            )
        }
    }
}
