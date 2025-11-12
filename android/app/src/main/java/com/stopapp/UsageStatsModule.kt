package com.stopapp

import android.app.AppOpsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

class UsageStatsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "UsageStatsBridge"
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val hasPermission = hasUsageStatsPermission(context)
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getUsageData(promise: Promise) {
        try {
            val context = reactApplicationContext
            val usageMap = SamsungWellbeingHelper.getAppUsageFromWellbeing(context)
            
            if (usageMap != null) {
                val resultArray: WritableArray = Arguments.createArray()
                
                for ((packageName, usageTime) in usageMap) {
                    val hours = usageTime.toDouble() / (1000.0 * 60.0 * 60.0)
                    
                    // 사용 시간이 0.01시간 이상인 것만 포함 (약 36초)
                    if (hours >= 0.01) {
                        val item: WritableMap = Arguments.createMap()
                        item.putString("packageName", packageName)
                        item.putString("appName", getAppName(context, packageName))
                        item.putDouble("hours", hours)
                        resultArray.pushMap(item)
                    }
                }
                
                promise.resolve(resultArray)
            } else {
                promise.resolve(Arguments.createArray())
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
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

    private fun hasUsageStatsPermission(context: Context): Boolean {
        return try {
            val appOpsManager = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOpsManager.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    context.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOpsManager.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    context.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            false
        }
    }

    private fun getAppName(context: Context, packageName: String): String {
        return try {
            val packageManager = context.packageManager
            val applicationInfo = packageManager.getApplicationInfo(packageName, 0)
            val label = packageManager.getApplicationLabel(applicationInfo)
            label.toString()
        } catch (e: Exception) {
            packageName
        }
    }
}