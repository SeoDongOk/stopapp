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

class PermissionHelper(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "PermissionHelper"
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
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                promise.resolve(false)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ===== 수면 감지 권한 =====
    @ReactMethod
    fun checkSleepPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            val bodySensorsGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.BODY_SENSORS
                ) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }
            
            promise.resolve(bodySensorsGranted)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestSleepPermission(promise: Promise) {
        try {
            val context = reactApplicationContext
            
            val intent = Intent().apply {
                action = "android.intent.action.VIEW"
                data = Uri.parse("samsunghealth://")
            }
            
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                promise.resolve(false)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
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
}