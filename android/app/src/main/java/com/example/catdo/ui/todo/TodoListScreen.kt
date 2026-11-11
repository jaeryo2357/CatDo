package com.example.catdo.ui.todo

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.catdo.model.TaskCategory
import com.example.catdo.model.TodoItem
import com.example.catdo.ui.theme.*

@Composable
fun TodoListScreen(
    todos: List<TodoItem>,
    onToggleComplete: (String) -> Unit,
    onDelete: (String) -> Unit,
    onAddTodo: (String, String?, TaskCategory) -> Unit,
    onClearCompleted: () -> Unit
) {
    var quickText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(TaskCategory.STUDY) }
    var activeTab by remember { mutableStateOf("active") } // "active" or "completed"

    val activeTodos = remember(todos) { todos.filter { !it.isCompleted } }
    val completedTodos = remember(todos) { todos.filter { it.isCompleted } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
    ) {
        // 1. Fast Inline Input Header
        Surface(
            color = SurfaceCard,
            shadowElevation = 1.dp
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Category Selector Chip
                    AssistChip(
                        onClick = {
                            val next = when (selectedCategory) {
                                TaskCategory.STUDY -> TaskCategory.WORK
                                TaskCategory.WORK -> TaskCategory.HEALTH
                                TaskCategory.HEALTH -> TaskCategory.LIFE
                                TaskCategory.LIFE -> TaskCategory.HOBBY
                                TaskCategory.HOBBY -> TaskCategory.STUDY
                            }
                            selectedCategory = next
                        },
                        label = { Text("${selectedCategory.icon} ${selectedCategory.label}", fontSize = 12.sp) },
                        shape = RoundedCornerShape(10.dp)
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    OutlinedTextField(
                        value = quickText,
                        onValueChange = { quickText = it },
                        placeholder = { Text("할 일 추가... (Enter)", fontSize = 13.sp, color = TextSecondary) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = {
                            if (quickText.isNotBlank()) {
                                onAddTodo(quickText.trim(), null, selectedCategory)
                                quickText = ""
                            }
                        })
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    Button(
                        onClick = {
                            if (quickText.isNotBlank()) {
                                onAddTodo(quickText.trim(), null, selectedCategory)
                                quickText = ""
                            }
                        },
                        enabled = quickText.isNotBlank(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AmberPrimary),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "추가", modifier = Modifier.size(18.dp))
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Segmented Tabs: 진행 중 vs 완료
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFFE7E5E4).copy(alpha = 0.5f))
                        .padding(2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TabButton(
                        text = "진행 중 (${activeTodos.size})",
                        isSelected = activeTab == "active",
                        onClick = { activeTab = "active" },
                        modifier = Modifier.weight(1f)
                    )
                    TabButton(
                        text = "완료 (${completedTodos.size})",
                        isSelected = activeTab == "completed",
                        onClick = { activeTab = "completed" },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // 2. Todo Item List
        val displayList = if (activeTab == "active") activeTodos else completedTodos

        if (displayList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "🐾", fontSize = 36.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (activeTab == "active") "진행 중인 할 일이 없습니다." else "완료된 할 일이 아직 없습니다.",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextSecondary
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(displayList, key = { it.id }) { item ->
                    NativeTodoItemCard(
                        item = item,
                        onToggleComplete = { onToggleComplete(item.id) },
                        onDelete = { onDelete(item.id) }
                    )
                }

                if (activeTab == "completed" && completedTodos.isNotEmpty()) {
                    item {
                        TextButton(
                            onClick = onClearCompleted,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("완료된 목록 정리하기", color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TabButton(
    text: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) SurfaceCard else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) TextPrimary else TextSecondary
        )
    }
}

@Composable
fun NativeTodoItemCard(
    item: TodoItem,
    onToggleComplete: () -> Unit,
    onDelete: () -> Unit
) {
    var isExpanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.5.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                // Round Checkbox
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(if (item.isCompleted) EmeraldSuccess else Color.White)
                        .clickable(onClick = onToggleComplete)
                        .padding(2.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (item.isCompleted) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(CircleShape)
                                .background(Color.Transparent)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = item.title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        textDecoration = if (item.isCompleted) TextDecoration.LineThrough else null,
                        color = if (item.isCompleted) TextSecondary else TextPrimary
                    )

                    if (!item.detail.isNullOrBlank()) {
                        Text(
                            text = item.detail,
                            fontSize = 12.sp,
                            color = TextSecondary,
                            textDecoration = if (item.isCompleted) TextDecoration.LineThrough else null,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    // Zero-Pill Unboxed Metadata
                    Row(
                        modifier = Modifier.padding(top = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = item.category.label, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Text(text = " · ", fontSize = 11.sp, color = TextSecondary)
                        Text(text = item.difficultyLabel, fontSize = 11.sp, color = TextSecondary)
                        Text(text = " · ", fontSize = 11.sp, color = TextSecondary)
                        Text(text = "🐟 +${item.rewardCoins}캔", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AmberDark)
                        Text(text = " · ", fontSize = 11.sp, color = TextSecondary)
                        Row(
                            modifier = Modifier.clickable { isExpanded = !isExpanded },
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = if (isExpanded) "닫기" else "냥이 생각", fontSize = 11.sp, color = AmberDark)
                            Icon(
                                if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = AmberDark
                            )
                        }
                    }
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "삭제", tint = Color.LightGray)
                }
            }

            // Expandable Cat Reflection & Pacing Tip Drawer
            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(AmberLight.copy(alpha = 0.5f))
                        .padding(10.dp)
                ) {
                    Text(
                        text = "🐾 집사 응원: ${item.analysis.rationale}",
                        fontSize = 11.sp,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "🐱 \"${item.analysis.catComment}\"",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = AmberDark
                    )
                    if (!item.analysis.suggestedPacing.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "💡 팁: ${item.analysis.suggestedPacing}",
                            fontSize = 10.sp,
                            color = TextSecondary
                        )
                    }
                }
            }
        }
    }
}
