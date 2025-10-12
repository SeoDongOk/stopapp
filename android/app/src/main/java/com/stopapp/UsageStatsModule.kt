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
    val pm = context.packageManager
    val endTime = System.currentTimeMillis()
    val startTime = endTime - 1000 * 60 * 60 * 24 // 지난 하루

    val stats = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY,
        startTime,
        endTime
    )

    val resultArray = Arguments.createArray()

    stats?.forEach { stat ->
        if (stat.totalTimeInForeground > 0) {
            try {
                val appInfo = pm.getApplicationInfo(stat.packageName, 0)
                val appName = pm.getApplicationLabel(appInfo).toString()

                val map = Arguments.createMap()
                map.putString("packageName", stat.packageName)
                map.putString("appName", appName) // ✅ 앱 이름 추가
                map.putDouble("hours", stat.totalTimeInForeground / 1000.0 / 3600.0)
                resultArray.pushMap(map)
            } catch (e: PackageManager.NameNotFoundException) {
                // 시스템 앱 등 패키지명만 존재하는 경우
            }
        }
    }

    promise.resolve(resultArray)
}
}