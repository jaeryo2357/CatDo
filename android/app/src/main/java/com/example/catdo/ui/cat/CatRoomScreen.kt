package com.example.catdo.ui.cat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.catdo.model.CatState
import com.example.catdo.ui.theme.*

@Composable
fun CatRoomScreen(
    cat: CatState,
    onPet: () -> Unit,
    onFeed: (cost: Int, fullness: Int, happiness: Int) -> Unit,
    onPlay: () -> Unit,
    onToggleSleep: () -> Unit,
    onOpenAdoption: () -> Unit,
    onGoToPark: () -> Unit
) {
    var showFeedSheet by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CanvasBg)
    ) {
        // 1. Top Cat Bio & Vitals Card
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            shape = RoundedCornerShape(20.dp),
            color = SurfaceCard,
            shadowElevation = 1.dp
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "🐱", fontSize = 28.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = cat.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = TextPrimary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Badge(containerColor = AmberPrimary) {
                                Text("Lv.${cat.level}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            if (cat.isHungry) {
                                Spacer(modifier = Modifier.width(4.dp))
                                Badge(containerColor = RoseAlert) {
                                    Text("배고파요!", color = Color.White, fontSize = 10.sp)
                                }
                            }
                        }
                        Text(
                            text = "${cat.breed.displayName} · ${cat.exp}/${cat.expToNext} EXP",
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }

                    // Vitals Bars
                    Column(horizontalAlignment = Alignment.End) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🥣 ${cat.fullness}%", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Spacer(modifier = Modifier.width(6.dp))
                            LinearProgressIndicator(
                                progress = { cat.fullness / 100f },
                                modifier = Modifier
                                    .width(60.dp)
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = if (cat.isHungry) RoseAlert else EmeraldSuccess,
                                trackColor = Color(0xFFE7E5E4)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("💖 ${cat.happiness}%", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Spacer(modifier = Modifier.width(6.dp))
                            LinearProgressIndicator(
                                progress = { cat.happiness / 100f },
                                modifier = Modifier
                                    .width(60.dp)
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = RoseAlert,
                                trackColor = Color(0xFFE7E5E4)
                            )
                        }
                    }
                }

                // Dialogue Bubble
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    color = AmberLight.copy(alpha = 0.6f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🐾", fontSize = 13.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (cat.currentAnimation == "sleep") "새근새근... 조용히 집사의 집중을 응원하고 있다냥... Zzz"
                            else if (cat.isHungry) "배가 꼬르륵거린다옹... 할일 하나 끝내고 캔 하나 사달라냥! 😿"
                            else "오늘도 훌륭한 집사와 함께해서 기쁘다옹! 사랑한다냥~ 💕",
                            fontSize = 11.sp,
                            color = AmberDark,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // 2. 3D Filament / Sceneview Cat Stage Viewport
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 12.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(Color(0xFFFFFDF8))
                .clickable { onPet() },
            contentAlignment = Alignment.Center
        ) {
            // Note: In runtime, Sceneview <Scene> renders the real-time 3D Cat filament mesh
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (cat.currentAnimation == "sleep") "🐱💤"
                    else if (cat.currentAnimation == "eat") "🐱🐟"
                    else "🐱✨",
                    fontSize = 72.sp
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "터치하여 ${cat.name} 쓰다듬기",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // 3. Bottom Action Controls
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = SurfaceCard,
            shadowElevation = 2.dp
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ActionBtn("쓰다듬기", "💖", modifier = Modifier.weight(1f)) { onPet() }
                    ActionBtn("밥 주기", "🐟", modifier = Modifier.weight(1f)) { showFeedSheet = !showFeedSheet }
                    ActionBtn("놀아주기", "🎾", modifier = Modifier.weight(1f)) { onPlay() }
                    ActionBtn(
                        if (cat.currentAnimation == "sleep") "깨우기" else "낮잠",
                        if (cat.currentAnimation == "sleep") "☀️" else "🌙",
                        modifier = Modifier.weight(1f)
                    ) { onToggleSleep() }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onGoToPark,
                        modifier = Modifier.weight(1.5f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                    ) {
                        Text("🌿 산책 광장 나가기", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = onOpenAdoption,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("📸 사진/묘종 변경", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionBtn(
    label: String,
    icon: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        color = AmberLight.copy(alpha = 0.4f),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(icon, fontSize = 18.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }
    }
}
