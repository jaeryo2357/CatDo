package com.example.catdo.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface TodoDao {
    @Query("SELECT * FROM todos ORDER BY isImportant DESC, createdAt DESC")
    fun getAllTodosFlow(): Flow<List<TodoEntity>>

    @Query("SELECT * FROM todos WHERE isCompleted = 0 ORDER BY isImportant DESC, createdAt DESC")
    fun getActiveTodosFlow(): Flow<List<TodoEntity>>

    @Query("SELECT * FROM todos WHERE isCompleted = 0 ORDER BY isImportant DESC, createdAt DESC LIMIT 5")
    suspend fun getTopActiveTodosForWidget(): List<TodoEntity>

    @Query("SELECT * FROM todos WHERE id = :id")
    suspend fun getTodoById(id: String): TodoEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTodo(todo: TodoEntity)

    @Update
    suspend fun updateTodo(todo: TodoEntity)

    @Delete
    suspend fun deleteTodo(todo: TodoEntity)

    @Query("DELETE FROM todos WHERE id = :id")
    suspend fun deleteTodoById(id: String)

    @Query("DELETE FROM todos WHERE isCompleted = 1")
    suspend fun clearCompletedTodos()
}
