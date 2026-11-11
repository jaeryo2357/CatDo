# 🐾 냥이투두 (CatDo) - Android Native Project

이 폴더는 냥이투두 웹 프로젝트의 비즈니스 로직과 UI/UX를 **Kotlin + Jetpack Compose + Android Glance Widget + Room Database + Sceneview 3D**로 1:1 완벽 마이그레이션한 정식 안드로이드 네이티브 프로젝트입니다.

---

## 📁 주요 패키지 및 아키텍처 구조

```
android/
├── settings.gradle.kts                   # 멀티모듈 및 레포지토리 세팅
├── build.gradle.kts                      # 루트 빌드 스크립트
└── app/
    ├── build.gradle.kts                  # Compose, Glance, Room, Sceneview, Gemini SDK 의존성
    └── src/main/
        ├── AndroidManifest.xml           # 권한, 액티비티, 위젯 리시버 등록
        ├── res/
        │   ├── values/                   # colors.xml, strings.xml, themes.xml
        │   └── xml/
        │       └── cat_todo_widget_info.xml # 안드로이드 홈스크린 위젯 메타데이터
        └── java/com/example/catdo/
            ├── MainActivity.kt           # 메인 Compose 엔트리포인트 (Scaffold & NavigationBar)
            ├── CatDoApp.kt               # Application 클래스 (Room DB 및 서비스 싱글톤)
            ├── model/
            │   ├── CatState.kt           # 고양이 상태, 묘종, 커스텀 외형 데이터 모델
            │   └── TodoItem.kt           # 투두 아이템, 난이도, 보상 모델
            ├── data/
            │   ├── local/
            │   │   ├── CatDoDatabase.kt  # Room Database
            │   │   ├── TodoDao.kt        # Reactive Flow 기반 데이터 접근 객체
            │   │   └── TodoEntity.kt     # Room 투두 테이블 엔티티
            │   └── remote/
            │       └── GeminiApiService.kt # Gemini 2.5 Flash를 통한 할일 가치 및 사진 분석
            └── ui/
                ├── theme/                # Material 3 테마, 컬러 팔레트 (따뜻한 페이퍼 & 앰버)
                ├── viewmodel/
                │   └── CatDoViewModel.kt # 고양이 육아, 투두 반응형 상태 관리
                ├── todo/
                │   └── TodoListScreen.kt # Zero-Pill 정갈한 네이티브 투두 화면
                ├── cat/
                │   └── CatRoomScreen.kt  # 3D 냥이 룸 & 인터랙션 (Sceneview)
                └── widget/
                    └── CatTodoGlanceWidget.kt # Jetpack Glance 홈스크린 상호작용 위젯
```

---

## 🚀 Android Studio에서 실행하는 방법

1. **Android Studio** (Ladybug 또는 최신 버전) 실행
2. `Open`을 누르고 이 리포지토리의 `android` 폴더 선택
3. Gradle Sync가 완료되면 빌드 및 에뮬레이터/실제 기기 실행 (`Shift + F10`)
4. 홈 화면에서 빈 곳을 길게 눌러 **위젯(Widget)** 메뉴로 이동 후 `냥이투두 빠른 할일 위젯`을 바탕화면에 배치해보세요!
