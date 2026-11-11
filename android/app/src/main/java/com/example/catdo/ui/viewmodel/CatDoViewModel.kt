package com.example.catdo.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.catdo.CatDoApp
import com.example.catdo.data.local.TodoEntity
import com.example.catdo.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class CatDoViewModel(application: Application) : AndroidViewModel(application) {
    private val app = application as CatDoApp
    private val todoDao = app.database.todoDao()
    private val geminiService = app.geminiService

    // Cat State
    private val _catState = MutableStateFlow(CatState())
    val catState: StateFlow<CatState> = _catState.asStateFlow()

    // Todos Flow directly from Room Database
    val todos: StateFlow<List<TodoItem>> = todoDao.getAllTodosFlow()
        .map { entities -> entities.map { it.toDomainModel() } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val pendingCount: StateFlow<Int> = todos
        .map { list -> list.count { !it.isCompleted } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // Temporary Banner Notification
    private val _bannerMessage = MutableStateFlow<String?>(null)
    val bannerMessage: StateFlow<String?> = _bannerMessage.asStateFlow()

    fun showBanner(msg: String) {
        _bannerMessage.value = msg
        viewModelScope.launch {
            kotlinx.coroutines.delay(3000)
            _bannerMessage.value = null
        }
    }

    fun addTodo(title: String, detail: String? = null, category: TaskCategory = TaskCategory.LIFE) {
        viewModelScope.launch {
            val analysis = geminiService.analyzeTaskEffort(title, detail, category)
            val newTodo = TodoItem(
                id = "todo_${System.currentTimeMillis()}",
                title = title,
                detail = detail,
                category = category,
                isCompleted = false,
                analysis = analysis
            )
            todoDao.insertTodo(TodoEntity.fromDomainModel(newTodo))
            showBanner("할일이 등록되었습니다! 보상: +${analysis.effortValue}캔")
        }
    }

    fun toggleComplete(todoId: String) {
        viewModelScope.launch {
            val entity = todoDao.getTodoById(todoId) ?: return@launch
            val willComplete = !entity.isCompleted
            val updated = entity.copy(
                isCompleted = willComplete,
                completedAt = if (willComplete) System.currentTimeMillis() else null
            )
            todoDao.updateTodo(updated)

            if (willComplete) {
                val coinsGained = entity.effortValue
                val current = _catState.value
                val newExp = current.exp + 20
                val didLevelUp = newExp >= current.expToNext
                val finalLevel = if (didLevelUp) current.level + 1 else current.level
                val finalExp = if (didLevelUp) newExp - current.expToNext else newExp

                _catState.value = current.copy(
                    coins = current.coins + coinsGained,
                    exp = finalExp,
                    level = finalLevel,
                    happiness = (current.happiness + 5).coerceAtMost(100),
                    totalTasksCompleted = current.totalTasksCompleted + 1,
                    currentAnimation = "happy"
                )
                showBanner("🏆 '${entity.title}' 완료! +${coinsGained}캔 획득! 🐟")
            }
        }
    }

    fun deleteTodo(todoId: String) {
        viewModelScope.launch {
            todoDao.deleteTodoById(todoId)
        }
    }

    fun clearCompleted() {
        viewModelScope.launch {
            todoDao.clearCompletedTodos()
            showBanner("완료된 목록을 비웠습니다.")
        }
    }

    fun feedCat(cost: Int, fullnessGained: Int, happinessGained: Int) {
        val current = _catState.value
        if (current.coins < cost) {
            showBanner("캔이 부족해요! 할일을 끝내고 캔을 모아보세요.")
            return
        }
        _catState.value = current.copy(
            coins = current.coins - cost,
            fullness = (current.fullness + fullnessGained).coerceAtMost(100),
            happiness = (current.happiness + happinessGained).coerceAtMost(100),
            currentAnimation = "eat"
        )
        showBanner("냠냠! 냥이가 맛있게 먹었습니다. 🐟")
    }

    fun petCat() {
        val current = _catState.value
        _catState.value = current.copy(
            happiness = (current.happiness + 8).coerceAtMost(100),
            currentAnimation = "happy"
        )
    }

    fun toggleSleep() {
        val current = _catState.value
        val nextAnim = if (current.currentAnimation == "sleep") "idle" else "sleep"
        _catState.value = current.copy(currentAnimation = nextAnim)
    }

    fun updateCatBreed(breed: CatBreed, name: String, custom: CustomCatAppearance? = null) {
        val current = _catState.value
        _catState.value = current.copy(
            breed = breed,
            name = name.ifBlank { current.name },
            customAppearance = custom
        )
        showBanner("냥이의 외형이 변경되었습니다! 🐾")
    }
}
