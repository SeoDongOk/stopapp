package com.stopapp

import android.content.Context
import android.util.Log
import android.app.usage.UsageStatsManager
import android.os.Build
import java.util.Calendar

object SamsungWellbeingHelper {
    
    const val TAG = "SamsungWellbeing"
    
    fun getAppUsageFromWellbeing(context: Context): Map<String, Long>? {
        return try {
            Log.d(TAG, "🔄 Attempting to get usage data...")
            
            // 먼저 접근성 서비스 권한 확인
            val accessibilityEnabled = isAccessibilityServiceEnabled(context)
            Log.d(TAG, "♿ Accessibility Service Enabled: $accessibilityEnabled")
            
            // UsageStatsManager 시도 (Android 5.0+)
            var usageMap = getUsageStatsFromManager(context)
            
            if (usageMap == null || usageMap.isEmpty()) {
                Log.d(TAG, "⚠️ UsageStatsManager returned empty, trying Samsung Wellbeing...")
                usageMap = getAppUsageFromWellbeingProvider(context)
            }
            
            usageMap
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error: ${e.message}", e)
            null
        }
    }
    
    private fun getUsageStatsFromManager(context: Context): Map<String, Long>? {
        return try {
            Log.d(TAG, "📊 Using UsageStatsManager method...")
            
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
                Log.w(TAG, "❌ UsageStatsManager requires API 21+")
                return null
            }
            
            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            if (usageStatsManager == null) {
                Log.w(TAG, "❌ UsageStatsManager is null")
                return null
            }
            
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            calendar.add(Calendar.DAY_OF_YEAR, -1) // 최근 1일
            val startTime = calendar.timeInMillis
            
            Log.d(TAG, "📅 Querying usage from ${calendar.time} to $endTime")
            
            val usageStatsList = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
            Log.d(TAG, "📈 Got ${usageStatsList.size} usage stats")
            
            val result = mutableMapOf<String, Long>()
            
            for (usageStats in usageStatsList) {
                val packageName = usageStats.packageName
                val usageTime = usageStats.totalTimeInForeground
                
                if (usageTime > 0) {
                    result[packageName] = usageTime
                    Log.d(TAG, "  📦 $packageName: ${usageTime}ms (${usageTime/1000}s)")
                }
            }
            
            if (result.isNotEmpty()) {
                Log.d(TAG, "✅ UsageStatsManager returned ${result.size} apps")
                result
            } else {
                Log.w(TAG, "❌ UsageStatsManager returned empty map")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ UsageStatsManager error: ${e.message}", e)
            null
        }
    }
    
    private fun getAppUsageFromWellbeingProvider(context: Context): Map<String, Long>? {
        return try {
            val contentResolver = context.contentResolver
            
            // Samsung Wellbeing ContentProvider 접근 시도
            val uriPatterns = listOf(
                "content://com.samsung.android.digitalwellbeing.provider/app_usage",
                "content://com.samsung.android.digitalwellbeing/app_usage",
                "content://com.samsung.android.digitalwellbeing.provider/package_usage_stats",
                "content://com.samsung.android.app.samsungapps.provider/app_usage"
            )
            
            for (uriPattern in uriPatterns) {
                try {
                    Log.d(TAG, "🔍 Trying URI: $uriPattern")
                    val uri = android.net.Uri.parse(uriPattern)
                    
                    val cursor = contentResolver.query(
                        uri,
                        null,
                        null,
                        null,
                        null
                    )
                    
                    if (cursor != null && cursor.count > 0) {
                        Log.d(TAG, "✅ Success! Found ${cursor.count} records")
                        val result = parseWellbeingCursor(cursor)
                        cursor.close()
                        
                        if (result.isNotEmpty()) {
                            return result
                        }
                    } else {
                        cursor?.close()
                    }
                } catch (e: Exception) {
                    Log.d(TAG, "  ❌ Failed: ${e.message}")
                }
            }
            
            Log.d(TAG, "❌ Could not access Samsung Wellbeing")
            null
        } catch (e: Exception) {
            Log.e(TAG, "❌ Wellbeing Provider error: ${e.message}", e)
            null
        }
    }
    
    private fun parseWellbeingCursor(cursor: android.database.Cursor): Map<String, Long> {
        val result = mutableMapOf<String, Long>()
        
        try {
            Log.d(TAG, "Columns: ${cursor.columnNames.joinToString(", ")}")
            
            while (cursor.moveToNext()) {
                try {
                    val packageName = getColumnValue(cursor, "package_name", "packageName", 0) as? String ?: continue
                    val usageTime = getColumnValue(cursor, "usage_time", "usageTime", "foreground_time", 1) as? Long ?: 0L
                    
                    if (packageName.isNotEmpty() && usageTime > 0) {
                        result[packageName] = usageTime
                        Log.d(TAG, "  📦 $packageName: ${usageTime}ms (${usageTime/1000}s)")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Parse error: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Cursor parse error: ${e.message}")
        }
        
        return result
    }
    
    private fun getColumnValue(cursor: android.database.Cursor, vararg columnNames: Any): Any? {
        for (columnName in columnNames) {
            try {
                val index = when (columnName) {
                    is String -> cursor.getColumnIndex(columnName)
                    is Int -> columnName
                    else -> -1
                }
                
                if (index >= 0) {
                    return when {
                        cursor.getType(index) == android.database.Cursor.FIELD_TYPE_STRING -> cursor.getString(index)
                        cursor.getType(index) == android.database.Cursor.FIELD_TYPE_INTEGER -> cursor.getLong(index)
                        else -> null
                    }
                }
            } catch (e: Exception) {
                // Try next
            }
        }
        return null
    }
    
    private fun isAccessibilityServiceEnabled(context: Context): Boolean {
        return try {
            val accessibilityManager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager
            accessibilityManager.isEnabled
        } catch (e: Exception) {
            false
        }
    }
}