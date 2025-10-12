package com.stopapp

import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class IntentLauncher(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "IntentLauncher"

    // ✅ 여기 이 함수가 들어갑니다
    @ReactMethod
    fun startActivity(params: ReadableMap) {
        val context = reactApplicationContext
        val intent = Intent(params.getString("action"))

        if (params.hasKey("data")) {
            intent.data = Uri.parse(params.getString("data"))
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}