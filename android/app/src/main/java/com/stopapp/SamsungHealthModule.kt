package com.stopapp

import android.util.Log
import com.facebook.react.bridge.*

class SamsungHealthModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SamsungHealthModule"
    }

    override fun getName(): String = "SamsungHealthModule"

    // ===== 초기화 (더미) =====
    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            Log.d(TAG, "✅ Samsung Health initialized (dummy)")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ===== 권한 요청 =====
    @ReactMethod
    fun requestPermissions(promise: Promise) {
        try {
            Log.d(TAG, "✅ Requesting permissions (dummy)")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ===== 수면 데이터 (더미) =====
    @ReactMethod
    fun getSleepData(days: Int, promise: Promise) {
        try {
            val sleepDataList = Arguments.createArray()
            Log.d(TAG, "📊 Sleep data (dummy)")
            promise.resolve(sleepDataList)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ===== 수면 패턴 분석 (더미) =====
    @ReactMethod
    fun analyzeSleepPattern(promise: Promise) {
        try {
            val analysis = Arguments.createMap()
            analysis.putDouble("averageDuration", 0.0)
            analysis.putInt("averageBedtime", 0)
            analysis.putInt("recordCount", 0)
            analysis.putInt("recommendedBedtime", 0)
            promise.resolve(analysis)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}