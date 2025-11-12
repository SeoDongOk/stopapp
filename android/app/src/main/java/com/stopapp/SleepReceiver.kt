package com.stopapp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.google.android.gms.location.ActivityRecognitionResult
import com.google.android.gms.location.DetectedActivity

class SleepReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (intent != null && ActivityRecognitionResult.hasResult(intent)) {
            val result = ActivityRecognitionResult.extractResult(intent!!)
            result?.mostProbableActivity?.let { activity ->
                when (activity.type) {
                    DetectedActivity.STILL -> Log.d("SleepReceiver", "User is still (possibly sleeping).")
                    DetectedActivity.ON_FOOT, DetectedActivity.WALKING -> Log.d("SleepReceiver", "User is walking.")
                    DetectedActivity.RUNNING -> Log.d("SleepReceiver", "User is running.")
                    else -> Log.d("SleepReceiver", "User activity: ${activity.type}")
                }
            }
        } else {
            Log.w("SleepReceiver", "No ActivityRecognitionResult in intent")
        }
    }
}