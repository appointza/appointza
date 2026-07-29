package com.appointza

import android.content.Intent
import android.util.Log

object NotificationOpenModule {

    private const val TAG = "NotificationOpenModule"

    @Volatile
    private var savedIntent: Intent? = null

    @Volatile
    private var activeAppointmentId: String? = null

    @Volatile
    private var notificationCallback: ((appointmentId: String, data: Map<String, String>) -> Unit)? = null

    fun setIntent(intent: Intent) {
        val appointmentId = intent.getStringExtra("appointmentId")
        
        if (!appointmentId.isNullOrBlank()) {
            savedIntent = intent
            Log.d(TAG, "Notification intent saved for appointmentId: $appointmentId")
            emitPendingNotificationOpen()
        }
    }

    fun shouldSuppressNotification(appointmentId: String): Boolean {
        return appointmentId.isNotBlank() && appointmentId == activeAppointmentId
    }

    fun setActiveAppointment(appointmentId: String) {
        activeAppointmentId = if (appointmentId.isNotBlank()) appointmentId else null
        Log.d(TAG, "Active appointment set to: $activeAppointmentId")
    }

    fun clearActiveAppointment() {
        activeAppointmentId = null
        Log.d(TAG, "Active appointment cleared")
    }

    fun getPendingNotificationOpen(): Intent? {
        return savedIntent?.also {
            savedIntent = null
        }
    }

    fun setNotificationCallback(callback: (appointmentId: String, data: Map<String, String>) -> Unit) {
        notificationCallback = callback
    }

    private fun emitPendingNotificationOpen() {
        savedIntent?.let { intent ->
            val appointmentId = intent.getStringExtra("appointmentId") ?: return@let
            val data = mutableMapOf<String, String>()
            
            intent.extras?.keySet()?.forEach { key ->
                val value = intent.getStringExtra(key)
                if (value != null) {
                    data[key] = value
                }
            }
            
            notificationCallback?.invoke(appointmentId, data)
            Log.d(TAG, "Pending notification emitted for appointmentId: $appointmentId")
            savedIntent = null
        }
    }
}