package com.example.catdo.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [TodoEntity::class], version = 1, exportSchema = false)
abstract class CatDoDatabase : RoomDatabase() {
    abstract fun todoDao(): TodoDao

    companion object {
        @Volatile
        private var INSTANCE: CatDoDatabase? = null

        fun getDatabase(context: Context): CatDoDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    CatDoDatabase::class.java,
                    "catdo_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
