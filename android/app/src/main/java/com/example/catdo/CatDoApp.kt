package com.example.catdo

import android.app.Application
import com.example.catdo.data.local.CatDoDatabase
import com.example.catdo.data.remote.GeminiApiService

class CatDoApp : Application() {
    val database: CatDoDatabase by lazy { CatDoDatabase.getDatabase(this) }
    val geminiService: GeminiApiService by lazy { GeminiApiService() }

    override fun onCreate() {
        super.onCreate()
    }
}
