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
        // 10일 전
        calendar.add(Calendar.DAY_OF_YEAR, -10)
        val tenDaysAgo = calendar.timeInMillis

        val pm = context.packageManager
        val resultArray = Arguments.createArray()

        var dayStart = tenDaysAgo
        while (dayStart < todayStart + 24L * 60 * 60 * 1000) {
            val dayEnd = dayStart + 24L * 60 * 60 * 1000
            
            // queryUsageStats를 우선적으로 사용 (더 정확함)
            val statsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, 
                dayStart, 
                dayEnd
            )
            
            val usageMap = mutableMapOf<String, Long>()
            
            // 먼저 UsageStats로 데이터 수집
            if (statsList != null && statsList.isNotEmpty()) {
                for (stats in statsList) {
                    val totalTime = stats.totalTimeInForeground
                    if (totalTime > 0) {
                        usageMap[stats.packageName] = totalTime
                    }
                }
            }
            
            // UsageEvents로 보완 (더 정확한 이벤트 기반 추적)
            val usageEvents = usageStatsManager.queryEvents(dayStart, dayEnd)
            val event = UsageEvents.Event()
            val eventMap = mutableMapOf<String, Long>()
            var currentPackage: String? = null
            var currentStartTime: Long = 0

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event)
                when (event.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED, 
                    UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                        currentPackage = event.packageName
                        currentStartTime = event.timeStamp
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED,
                    UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                        if (currentPackage == event.packageName && currentStartTime != 0L) {
                            val duration = event.timeStamp - currentStartTime
                            if (duration > 0 && duration < 24L * 60 * 60 * 1000) { // 24시간 이내만
                                eventMap[currentPackage!!] = 
                                    (eventMap[currentPackage] ?: 0L) + duration
                            }
                            currentPackage = null
                            currentStartTime = 0
                        }
                    }
                }
            }
            
            // 두 방식 중 더 큰 값을 사용
            for ((pkg, time) in eventMap) {
                val currentTime = usageMap[pkg] ?: 0L
                if (time > currentTime) {
                    usageMap[pkg] = time
                }
            }

            for ((packageName, totalMs) in usageMap) {
                // 제외할 패키지 체크
                if (shouldExcludePackage(packageName)) {
                    continue
                }
                
                // 최소 사용 시간 필터 (1초 이상)
                if (totalMs < 1000) {
                    continue
                }
                
                try {
                    val appInfo = pm.getApplicationInfo(packageName, 0)
                    
                    // 런처 인텐트가 있는 앱만 포함 (사용자가 실행할 수 있는 앱)
                    val launchIntent = pm.getLaunchIntentForPackage(packageName)
                    if (launchIntent == null) {
                        // 시스템 앱 중 사용자 대면 앱인지 확인
                        val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                        if (isSystemApp && !isUserFacingSystemApp(packageName)) {
                            continue
                        }
                    }
                    
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    val map = Arguments.createMap()
                    map.putString("packageName", packageName)
                    map.putString("appName", appName)
                    
                    // 아이콘 가져오기
                    try {
                        val icon = pm.getApplicationIcon(appInfo)
                        val bitmap = if (icon is android.graphics.drawable.BitmapDrawable) {
                            icon.bitmap
                        } else {
                            android.graphics.Bitmap.createBitmap(
                                icon.intrinsicWidth.coerceAtLeast(1),
                                icon.intrinsicHeight.coerceAtLeast(1),
                                android.graphics.Bitmap.Config.ARGB_8888
                            ).also {
                                val canvas = android.graphics.Canvas(it)
                                icon.setBounds(0, 0, canvas.width, canvas.height)
                                icon.draw(canvas)
                            }
                        }
                        
                        val stream = java.io.ByteArrayOutputStream()
                        bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                        val base64Icon = android.util.Base64.encodeToString(
                            stream.toByteArray(), 
                            android.util.Base64.DEFAULT
                        )
                        map.putString("iconBase64", base64Icon)
                    } catch (e: Exception) {
                        map.putNull("iconBase64")
                    }
                    
                    map.putDouble("hours", totalMs / 1000.0 / 3600.0)
                    map.putString("date", Date(dayStart).toString())
                    resultArray.pushMap(map)
                } catch (e: PackageManager.NameNotFoundException) {
                    // 패키지를 찾을 수 없는 경우 무시
                } catch (e: Exception) {
                    // 기타 예외 무시
                }
            }

            dayStart += 24L * 60 * 60 * 1000
        }

        promise.resolve(resultArray)
    }

    // 제외할 패키지인지 확인 (더 보수적으로 변경)
    private fun shouldExcludePackage(packageName: String): Boolean {
        // 명시적으로 제외할 시스템 컴포넌트만 제외
        val excludeList = setOf(
            "android",
            "com.android.systemui",
            "com.android.inputmethod",
            "com.sec.android.inputmethod",
            "com.google.android.inputmethod"
        )
        
        if (excludeList.contains(packageName)) {
            return true
        }
        
        val lowerPackage = packageName.lowercase()
        
        // 런처만 제외
        if (lowerPackage.endsWith(".launcher") || 
            lowerPackage.endsWith(".launcher2") ||
            lowerPackage.endsWith(".launcher3")) {
            return true
        }
        
        // 배경화면만 제외
        if (lowerPackage.contains("wallpaper") && 
            (lowerPackage.contains("live") || lowerPackage.contains("picker"))) {
            return true
        }
        
        return false
    }

    // 사용자가 직접 사용하는 시스템 앱인지 확인
    private fun isUserFacingSystemApp(packageName: String): Boolean {
        val userFacingApps = setOf(
            // Google 앱들
            "com.google.android.youtube",
            "com.google.android.apps.maps",
            "com.google.android.gm",
            "com.google.android.music",
            "com.google.android.videos",
            "com.google.android.apps.photos",
            "com.android.chrome",
            "com.android.vending",
            
            // Samsung 앱들
            "com.samsung.android.messaging",
            "com.samsung.android.calendar",
            "com.samsung.android.gallery",
            "com.samsung.android.email",
            "com.sec.android.app.sbrowser",
            "com.samsung.android.contacts",
            
            // 기본 안드로이드 앱들
            "com.android.contacts",
            "com.android.calendar",
            "com.android.camera",
            "com.android.camera2",
            "com.android.gallery3d",
            "com.android.email",
            "com.android.settings",
            
            // 주요 서드파티 앱들
            "com.kakao.talk",
            "com.nhn.android.webtoon",
            "com.naver.linewebtoon",
            "com.facebook.katana",
            "com.instagram.android",
            "com.twitter.android",
            "com.whatsapp",
            "com.netflix.mediaclient"
        )
        
        // 정확한 패키지명 매칭
        if (userFacingApps.contains(packageName)) {
            return true
        }
        
        // prefix 매칭
        val userFacingPrefixes = listOf(
            "com.kakao",
            "com.nhn",
            "com.naver",
            "com.microsoft.office"
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