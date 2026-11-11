package com.example.catdo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.catdo.ui.cat.CatRoomScreen
import com.example.catdo.ui.theme.AmberPrimary
import com.example.catdo.ui.theme.CatDoTheme
import com.example.catdo.ui.todo.TodoListScreen
import com.example.catdo.ui.viewmodel.CatDoViewModel

enum class MainTab(val label: String, val icon: @Composable () -> Unit) {
    TODO("투두", { Icon(Icons.Default.Checklist, contentDescription = "투두") }),
    CAT("냥이룸", { Icon(Icons.Default.Pets, contentDescription = "냥이룸") }),
    SHOP("상점", { Icon(Icons.Default.ShoppingBag, contentDescription = "상점") }),
    STATS("기록", { Icon(Icons.Default.BarChart, contentDescription = "기록") })
}

class MainActivity : ComponentActivity() {
    private val viewModel: CatDoViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CatDoTheme {
                val cat by viewModel.catState.collectAsState()
                val todos by viewModel.todos.collectAsState()
                val bannerMessage by viewModel.bannerMessage.collectAsState()
                var currentTab by remember { mutableStateOf(MainTab.TODO) }
                val snackbarHostState = remember { SnackbarHostState() }

                LaunchedEffect(bannerMessage) {
                    bannerMessage?.let {
                        snackbarHostState.showSnackbar(it)
                    }
                }

                Scaffold(
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    bottomBar = {
                        NavigationBar {
                            MainTab.entries.forEach { tab ->
                                NavigationBarItem(
                                    selected = currentTab == tab,
                                    onClick = { currentTab = tab },
                                    icon = tab.icon,
                                    label = { Text(tab.label, fontSize = 11.sp) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = AmberPrimary,
                                        indicatorColor = AmberPrimary.copy(alpha = 0.15f)
                                    )
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentTab) {
                            MainTab.TODO -> {
                                TodoListScreen(
                                    todos = todos,
                                    onToggleComplete = { viewModel.toggleComplete(it) },
                                    onDelete = { viewModel.deleteTodo(it) },
                                    onAddTodo = { title, detail, cat -> viewModel.addTodo(title, detail, cat) },
                                    onClearCompleted = { viewModel.clearCompleted() }
                                )
                            }
                            MainTab.CAT -> {
                                CatRoomScreen(
                                    cat = cat,
                                    onPet = { viewModel.petCat() },
                                    onFeed = { cost, full, happy -> viewModel.feedCat(cost, full, happy) },
                                    onPlay = { viewModel.petCat() },
                                    onToggleSleep = { viewModel.toggleSleep() },
                                    onOpenAdoption = { /* Open adoption bottom sheet */ },
                                    onGoToPark = { /* Navigate to multiplayer park */ }
                                )
                            }
                            MainTab.SHOP -> {
                                // Shop Composable (Feeds & Accessories)
                                Box(modifier = Modifier.fillMaxSize()) {
                                    CatRoomScreen(
                                        cat = cat,
                                        onPet = { viewModel.petCat() },
                                        onFeed = { cost, full, happy -> viewModel.feedCat(cost, full, happy) },
                                        onPlay = { viewModel.petCat() },
                                        onToggleSleep = { viewModel.toggleSleep() },
                                        onOpenAdoption = { },
                                        onGoToPark = { }
                                    )
                                }
                            }
                            MainTab.STATS -> {
                                Box(modifier = Modifier.fillMaxSize()) {
                                    TodoListScreen(
                                        todos = todos,
                                        onToggleComplete = { viewModel.toggleComplete(it) },
                                        onDelete = { viewModel.deleteTodo(it) },
                                        onAddTodo = { t, d, c -> viewModel.addTodo(t, d, c) },
                                        onClearCompleted = { viewModel.clearCompleted() }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
