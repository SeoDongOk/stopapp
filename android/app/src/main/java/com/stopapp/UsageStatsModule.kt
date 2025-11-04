package com.stopapp

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.ApplicationInfo
import com.facebook.react.bridge.*
import java.util.*

class UsageStatsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "UsageStatsBridge"

    @ReactMethod
    fun getUsageData(promise: Promise) {
        val context = reactApplicationContext
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.packageName
        )

        if (mode != AppOpsManager.MODE_ALLOWED) {
            promise.reject("PERMISSION_DENIED", "Usage access permission not granted.")
            return
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = endTime
        // Set to start of today
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val todayStart = calendar.timeInMillis
        // 1년 전
        calendar.add(Calendar.YEAR, -1)
        val oneYearAgo = calendar.timeInMillis

        val pm = context.packageManager
        val resultArray = Arguments.createArray()

        var dayStart = oneYearAgo
        while (dayStart < todayStart + 24L * 60 * 60 * 1000) {
            val dayEnd = dayStart + 24L * 60 * 60 * 1000
            val usageEvents = usageStatsManager.queryEvents(dayStart, dayEnd)
            val event = UsageEvents.Event()
            val usageMap = mutableMapOf<String, Long>()
            var currentPackage: String? = null
            var currentStartTime: Long = 0

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        currentPackage = event.packageName
                        currentStartTime = event.timeStamp
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED -> {
                        if (currentPackage == event.packageName && currentStartTime != 0L) {
                            val duration = event.timeStamp - currentStartTime
                            if (duration > 0) {
                                currentPackage?.let {
                                    usageMap[it] = (usageMap[it] ?: 0L) + duration
                                }
                            }
                            currentPackage = null
                            currentStartTime = 0
                        }
                    }
                }
            }

            // Supplement missing apps using queryUsageStats
            val statsList = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, dayStart, dayEnd)
            if (statsList != null) {
                for (stats in statsList) {
                    val pkg = stats.packageName
                    if (!usageMap.containsKey(pkg)) {
                        usageMap[pkg] = stats.totalTimeInForeground
                    }
                }
            }

            for ((packageName, totalMs) in usageMap) {
                // 제외할 패키지들 (런처, 시스템 UI 등)
                if (shouldExcludePackage(packageName)) {
                    continue
                }
                
                if (totalMs > 0) {
                    try {
                        val appInfo = pm.getApplicationInfo(packageName, PackageManager.MATCH_UNINSTALLED_PACKAGES)
                        
                        // 시스템 앱이지만 사용자가 상호작용하는 앱인지 확인
                        val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                        val isUpdatedSystemApp = (appInfo.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
                        
                        // 업데이트된 시스템 앱이거나, 일반 앱이면 포함
                        // 순수 시스템 앱 중에서도 사용자가 직접 사용하는 앱들은 포함
                        if (isSystemApp && !isUpdatedSystemApp && !isUserFacingSystemApp(packageName)) {
                            continue
                        }
                        
                        val appName = pm.getApplicationLabel(appInfo).toString()
                        val map = Arguments.createMap()
                        map.putString("packageName", packageName)
                        map.putString("appName", appName)
                        
                        // 아이콘 가져오기
                        try {
                            val icon = pm.getApplicationIcon(appInfo)
                            if (icon is android.graphics.drawable.BitmapDrawable) {
                                val bitmap = icon.bitmap
                                val stream = java.io.ByteArrayOutputStream()
                                bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                                val base64Icon = android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.DEFAULT)
                                map.putString("iconBase64", base64Icon)
                            } else {
                                // BitmapDrawable이 아닌 경우 변환
                                val bitmap = android.graphics.Bitmap.createBitmap(
                                    icon.intrinsicWidth,
                                    icon.intrinsicHeight,
                                    android.graphics.Bitmap.Config.ARGB_8888
                                )
                                val canvas = android.graphics.Canvas(bitmap)
                                icon.setBounds(0, 0, canvas.width, canvas.height)
                                icon.draw(canvas)
                                val stream = java.io.ByteArrayOutputStream()
                                bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                                val base64Icon = android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.DEFAULT)
                                map.putString("iconBase64", base64Icon)
                            }
                        } catch (e: Exception) {
                            // 아이콘을 가져올 수 없는 경우 null
                            map.putNull("iconBase64")
                        }
                        
                        map.putDouble("hours", totalMs / 1000.0 / 3600.0)
                        map.putString("date", Date(dayStart).toString())
                        resultArray.pushMap(map)
                    } catch (e: PackageManager.NameNotFoundException) {
                        // ignore unknown packages
                    }
                }
            }

            dayStart += 24L * 60 * 60 * 1000
        }

        promise.resolve(resultArray)
    }

    // 제외할 패키지인지 확인
    private fun shouldExcludePackage(packageName: String): Boolean {
        val lowerPackage = packageName.lowercase()
        return lowerPackage.contains("launcher") ||
               lowerPackage.contains(".home") ||
               lowerPackage.contains("systemui") ||
               lowerPackage.contains("inputmethod") ||
               lowerPackage.contains("wallpaper") ||
               lowerPackage == "android" ||
               lowerPackage.startsWith("com.android.") && !isUserFacingAndroidApp(lowerPackage)
    }

    // 사용자가 직접 사용하는 안드로이드 시스템 앱인지 확인
    private fun isUserFacingAndroidApp(packageName: String): Boolean {
        val userFacingApps = listOf(
            "com.android.chrome",
            "com.android.vending", // Play Store
            "com.android.contacts",
            "com.android.calendar",
            "com.android.camera",
            "com.android.gallery3d",
            "com.android.email",
            "com.android.music",
            "com.android.settings"
        )
        return userFacingApps.contains(packageName)
    }

    // 사용자가 직접 사용하는 시스템 앱인지 확인 (Google, Samsung 등)
    private fun isUserFacingSystemApp(packageName: String): Boolean {
        val userFacingPrefixes = listOf(
            "com.google.android.youtube",
            "com.google.android.apps",
            "com.google.android.gm", // Gmail
            "com.google.android.music",
            "com.google.android.videos",
            "com.samsung.android.messaging",
            "com.samsung.android.calendar",
            "com.samsung.android.gallery",
            "com.samsung.android.email",
            "com.sec.android.app.sbrowser", // Samsung Browser
            "com.microsoft.office",
            "com.facebook.katana",
            "com.instagram.android",
            "com.twitter.android",
            "com.whatsapp"
        )
        
        return userFacingPrefixes.any { packageName.startsWith(it) }
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val context = reactApplicationContext
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            context.packageName
        )
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }
}