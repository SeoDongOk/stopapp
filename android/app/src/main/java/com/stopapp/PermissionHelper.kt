package com.stopapp

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.util.*

class PermissionHelper(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "PermissionHelper"
        private const val TAG = "PermissionHelper"
    }

    override fun getName(): String = NAME

    // ===== 오버레이 권한 =====
    @ReactMethod
    fun checkDrawOverlayPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(context)
            } else {
                true
            }
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestDrawOverlayPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(context)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${context.packageName}")
                    )
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    context.startActivity(intent)
                    promise.resolve(false)
                } else {
                    promise.resolve(true)
                }
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ===== 알림 권한 =====
    @ReactMethod
    fun checkNotificationPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                // Android 13+: 알림 설정으로 이동
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            } else {
                // Android 12 이하: 앱 설정으로 이동
                val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            }
            promise.resolve(false)
        } catch (e: Exception) {
            android.util.Log.e("PermissionHelper", "Notification request error: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    // ===== 수면 감지 권한 =====
    @ReactMethod
    fun checkSleepPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // ✅ 배터리 최적화 무시 권한 확인
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as android.os.PowerManager
            val sleepGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                powerManager.isIgnoringBatteryOptimizations(context.packageName)
            } else {
                true
            }
            
            promise.resolve(sleepGranted)
        } catch (e: Exception) {
            android.util.Log.e("PermissionHelper", "Check sleep error: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestSleepPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            // ✅ 배터리 최적화 무시 요청
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent().apply {
                    action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                    data = Uri.parse("package:${context.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                android.util.Log.d("PermissionHelper", "✅ Sleep permission request sent")
                promise.resolve(false)
            } else {
                android.util.Log.d("PermissionHelper", "⚠️ Sleep permission not needed for this Android version")
                promise.resolve(true)
            }
        } catch (e: Exception) {
            android.util.Log.e("PermissionHelper", "❌ Sleep request error: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }

    

    // ===== 접근성 서비스 권한 =====
    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val isEnabled = isAccessibilityServiceEnabled(context)
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestAccessibilityPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            promise.resolve(false)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun isAccessibilityServiceEnabled(context: Context): Boolean {
        return try {
            val accessibilityManager = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as android.view.accessibility.AccessibilityManager
            accessibilityManager.isEnabled
        } catch (e: Exception) {
            false
        }
    }

    // ===== 연락처 권한 =====
    @ReactMethod
    fun checkContactsPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            val hasPermission = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_CONTACTS
            ) == PackageManager.PERMISSION_GRANTED
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    @ReactMethod
    fun requestSamsungHealthPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            android.util.Log.d("PermissionHelper", "✅ Samsung Health permission requested (dummy)")
            promise.resolve(true)
        } catch (e: Exception) {
            android.util.Log.e("PermissionHelper", "❌ Samsung Health request error: ${e.message}")
            promise.reject("ERROR", e.message)
        }
    }
}