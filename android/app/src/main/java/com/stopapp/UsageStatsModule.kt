package com.stopapp

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.util.Log
import android.content.pm.PackageManager

class UsageStatsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "UsageStatsBridge"
        const val TAG = "UsageStatsBridge"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val hasPermission = hasUsageStatsPermission(context)
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            Log.e(TAG, "checkPermission error", e)
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getUsageData(promise: Promise) {
        Log.d(TAG, "🔄 getUsageData called")
        
        try {
            val context = reactApplicationContext
            Log.d(TAG, "📱 reactApplicationContext: $context")
            
            // Samsung Wellbeing 데이터 조회
            val usageMap = SamsungWellbeingHelper.getAppUsageFromWellbeing(context)
            Log.d(TAG, "📊 usageMap from SamsungWellbeingHelper: $usageMap")
            
            val resultArray: WritableArray = Arguments.createArray()
            
            // 데이터가 없으면 테스트 데이터 사용
            val dataToUse = usageMap
            
            if (dataToUse.isNotEmpty()) {
                Log.d(TAG, "✅ Got ${dataToUse.size} apps")
                
                for ((packageName, usageTime) in dataToUse) {
                    try {
                        val hours = usageTime.toDouble() / (1000.0 * 60.0 * 60.0)
                        
                        if (hours >= 0.01) {
                            val item: WritableMap = Arguments.createMap()
                            item.putString("packageName", packageName)
                            item.putString("appName", getAppName(context, packageName))
                            item.putString("iconBase64", getAppIconBase64(context, packageName))  // ← 이 줄 추가
                            item.putDouble("hours", hours)
                            item.putString("date", getCurrentDate())
                            resultArray.pushMap(item)
                            
                            Log.d(TAG, "  📱 $packageName: ${String.format("%.2f", hours)}h")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error processing app: $packageName", e)
                    }
                }
            }
            
            Log.d(TAG, "✅ Resolving with ${resultArray.size()} apps")
            promise.resolve(resultArray)
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ getUsageData error", e)
            e.printStackTrace()
            promise.reject("ERROR", e.toString())
        }
    }

    @ReactMethod
    fun getCurrentForegroundApp(promise: Promise) {
        try {
            val context = reactApplicationContext
            val foregroundApp = AppForegroundHelper.getForegroundAppViaActivityManager(context)
            promise.resolve(foregroundApp)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun hasUsageStatsPermission(context: android.content.Context): Boolean {
        return try {
            val accessibilityManager = context.getSystemService(android.content.Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager
            accessibilityManager.isEnabled
        } catch (e: Exception) {
            false
        }
    }

    private fun getAppName(context: android.content.Context, packageName: String): String {
        return try {
            val packageManager = context.packageManager
            val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
            val label = packageManager.getApplicationLabel(applicationInfo)
            label.toString()
        } catch (e: Exception) {
            packageName
        }
    }

    private fun getCurrentDate(): String {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
        return sdf.format(java.util.Date())
    }

    private fun getAppIconBase64(context: android.content.Context, packageName: String): String? {
        return try {
            val packageManager = context.packageManager
            val drawable = packageManager.getApplicationIcon(packageName)
            
            // Drawable를 Bitmap으로 변환
            val bitmap = android.graphics.Bitmap.createBitmap(
                drawable.intrinsicWidth,
                drawable.intrinsicHeight,
                android.graphics.Bitmap.Config.ARGB_8888
            )
            val canvas = android.graphics.Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            
            // Bitmap을 Base64로 변환
            val outputStream = java.io.ByteArrayOutputStream()
            bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, outputStream)
            val imageBytes = outputStream.toByteArray()
            android.util.Base64.encodeToString(imageBytes, android.util.Base64.DEFAULT)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting app icon for $packageName: ${e.message}")
            null
        }
    }
}