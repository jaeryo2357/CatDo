package com.example.catdo.ui.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.*
import androidx.glance.action.ActionParameters
import androidx.glance.action.actionParametersOf
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.example.catdo.CatDoApp
import com.example.catdo.MainActivity
import com.example.catdo.data.local.TodoEntity
import com.example.catdo.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class CatTodoGlanceWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val app = context.applicationContext as CatDoApp
        val activeTodos = withContext(Dispatchers.IO) {
            app.database.todoDao().getTopActiveTodosForWidget()
        }

        provideContent {
            WidgetContent(
                activeTodos = activeTodos,
                catName = "치즈",
                catFullness = 75
            )
        }
    }

    @Composable
    private fun WidgetContent(
        activeTodos: List<TodoEntity>,
        catName: String,
        catFullness: Int
    ) {
        Column(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(CanvasBg))
                .padding(14.dp)
                .clickable(actionStartActivity<MainActivity>())
        ) {
            // Header Bar
            Row(
                modifier = GlanceModifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🐾 냥이투두 · $catName",
                    style = TextStyle(
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = ColorProvider(TextPrimary)
                    )
                )
                Spacer(modifier = GlanceModifier.defaultWeight())
                Text(
                    text = "🥣 $catFullness%",
                    style = TextStyle(
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = ColorProvider(AmberDark)
                    )
                )
            }

            Spacer(modifier = GlanceModifier.height(8.dp))

            if (activeTodos.isEmpty()) {
                Box(
                    modifier = GlanceModifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "오늘의 할 일을 모두 완료했습니다! 🐟",
                        style = TextStyle(fontSize = 12.sp, color = ColorProvider(TextSecondary))
                    )
                }
            } else {
                LazyColumn(modifier = GlanceModifier.fillMaxSize()) {
                    items(activeTodos) { todo ->
                        Row(
                            modifier = GlanceModifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                text = "○",
                                onClick = actionRunCallback<CompleteTodoActionCallback>(
                                    actionParametersOf(CompleteTodoActionCallback.TodoIdKey to todo.id)
                                )
                            )
                            Spacer(modifier = GlanceModifier.width(8.dp))
                            Text(
                                text = todo.title,
                                style = TextStyle(fontSize = 13.sp, color = ColorProvider(TextPrimary)),
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}

class CompleteTodoActionCallback : ActionCallback {
    companion object {
        val TodoIdKey = ActionParameters.Key<String>("todo_id")
    }

    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val todoId = parameters[TodoIdKey] ?: return
        val app = context.applicationContext as CatDoApp
        val todo = app.database.todoDao().getTodoById(todoId) ?: return

        app.database.todoDao().updateTodo(
            todo.copy(
                isCompleted = true,
                completedAt = System.currentTimeMillis()
            )
        )

        // Trigger widget update
        CatTodoGlanceWidget().update(context, glanceId)
    }
}

class CatTodoWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = CatTodoGlanceWidget()
}
