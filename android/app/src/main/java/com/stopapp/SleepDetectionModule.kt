package com.stopapp

import android.app.PendingIntent
import android.content.Intent
import com.facebook.react.bridge.*
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityRecognitionClient

class SleepDetectionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val activityRecognitionClient: ActivityRecognitionClient =
        ActivityRecognition.getClient(reactContext)

    override fun getName() = "SleepDetectionModule"

    @ReactMethod
    fun startSleepDetection(promise: Promise) {
        try {
            val intent = Intent(reactContext, SleepReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )

            activityRecognitionClient.requestActivityUpdates(5000, pendingIntent)
            promise.resolve("Sleep detection started.")
        } catch (e: Exception) {
            promise.reject("ERROR_STARTING_SLEEP_DETECTION", e.message)
        }
    }
}