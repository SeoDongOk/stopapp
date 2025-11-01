package com.stopapp

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
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

    // 날짜별 loop
    var dayStart = oneYearAgo
    while (dayStart < todayStart + 24L * 60 * 60 * 1000) {
        val dayEnd = dayStart + 24L * 60 * 60 * 1000
        val statsList = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            dayStart,
            dayEnd
        )
        if (statsList != null) {
            for (stats in statsList) {
                val packageName = stats.packageName
                val totalMs = stats.totalTimeInForeground
                if (totalMs > 0) {
                    try {
                        val appInfo = pm.getApplicationInfo(packageName, 0)
                        val appName = pm.getApplicationLabel(appInfo).toString()
                        val map = Arguments.createMap()
                        map.putString("packageName", packageName)
                        map.putString("appName", appName)
                        map.putDouble("hours", totalMs / 1000.0 / 3600.0)
                        map.putString("date", Date(dayStart).toString())
                        resultArray.pushMap(map)
                    } catch (e: PackageManager.NameNotFoundException) {
                        // ignore unknown packages
                    }
                }
            }
        }
        dayStart += 24L * 60 * 60 * 1000
    }

    promise.resolve(resultArray)
}
}