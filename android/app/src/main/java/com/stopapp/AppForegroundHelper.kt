package com.stopapp

import android.content.Context
import android.util.Log

object AppForegroundHelper {
    
    const val TAG = "AppForegroundHelper"
    
    // dumpsys meminfo로 포그라운드 앱 정보 추출
    fun getCurrentForegroundApp(context: Context): String? {
        return try {
            val process = Runtime.getRuntime().exec("dumpsys window windows")
            val reader = process.inputStream.bufferedReader()
            val output = reader.readText()
            reader.close()
            
            // mCurrentFocus에서 패키지명 추출
            val regex = """mCurrentFocus=.*?\/([\w.]+)""".toRegex()
            val match = regex.find(output)
            
            val packageName = match?.groupValues?.get(1)
            Log.d(TAG, "Current foreground app: $packageName")
            
            packageName
        } catch (e: Exception) {
            Log.e(TAG, "Error getting foreground app: ${e.message}")
            null
        }
    }
    
    // ActivityManager로 포그라운드 앱 감지 (더 정확)
    fun getForegroundAppViaActivityManager(context: Context): String? {
        return try {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            
            // UsageEvents 대신 running tasks 사용
            val tasks = am.getRunningTasks(1)
            if (tasks.isNotEmpty()) {
                val topActivity = tasks[0].topActivity
                Log.d(TAG, "Top activity: $topActivity")
                topActivity?.packageName
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting foreground app via ActivityManager: ${e.message}")
            null
        }
    }
}