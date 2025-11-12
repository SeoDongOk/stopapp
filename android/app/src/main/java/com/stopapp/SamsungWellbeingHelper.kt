package com.stopapp

import android.content.Context
import android.util.Log

object SamsungWellbeingHelper {
    
    const val TAG = "SamsungWellbeing"
    
    fun getAppUsageFromWellbeing(context: Context): Map<String, Long>? {
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
            
            Log.d(TAG, "Could not access Samsung Wellbeing")
            null
        } catch (e: Exception) {
            Log.e(TAG, "Error: ${e.message}")
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
}