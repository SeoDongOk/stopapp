package com.stopapp

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import java.text.SimpleDateFormat
import java.util.*

class MyAccessibilityService : AccessibilityService() {

    companion object {
        const val PREFS_NAME = "app_usage_data"
        const val TAG = "MyAccessibilityService"
    }

    private lateinit var prefs: SharedPreferences
    private var currentPackage = ""
    private var currentStartTime = 0L
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val packageName = event.packageName?.toString() ?: return

        // 여러 이벤트 타입에서 앱 전환 감지
        when (event.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                
                if (packageName != currentPackage) {
                    // 이전 앱 사용 시간 저장
                    if (currentPackage.isNotEmpty() && currentStartTime > 0) {
                        val duration = System.currentTimeMillis() - currentStartTime
                        if (duration >= 1000) { // 1초 이상만 저장
                            saveUsageData(currentPackage, duration)
                        }
                    }

                    // 새로운 앱으로 변경
                    currentPackage = packageName
                    currentStartTime = System.currentTimeMillis()
                }
            }
        }
    }

    private fun saveUsageData(packageName: String, duration: Long) {
        try {
            val today = dateFormat.format(Date())
            val key = "${today}_$packageName"
            
            val currentUsage = prefs.getLong(key, 0L)
            prefs.edit().putLong(key, currentUsage + duration).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onInterrupt() {
        // 서비스 중단 시 현재 앱 사용 시간 저장
        if (currentPackage.isNotEmpty() && currentStartTime > 0) {
            val duration = System.currentTimeMillis() - currentStartTime
            if (duration >= 1000) {
                saveUsageData(currentPackage, duration)
            }
        }
    }

    override fun onDestroy() {
        // 서비스 종료 시 현재 앱 사용 시간 저장
        if (currentPackage.isNotEmpty() && currentStartTime > 0) {
            val duration = System.currentTimeMillis() - currentStartTime
            if (duration >= 1000) {
                saveUsageData(currentPackage, duration)
            }
        }
        super.onDestroy()
    }
}