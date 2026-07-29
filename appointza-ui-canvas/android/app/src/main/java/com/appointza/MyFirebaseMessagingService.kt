package com.appointza

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "MyFirebaseMessagingService"
        private const val CHANNEL_ID = "fcm_default_channel"
        private const val CHANNEL_NAME = "Default Notifications"
        private const val EXTRA_NOTIFICATION_OPEN = "notification_open"
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM token: $token")
        sendRegistrationTokenToServer(token)
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "Message received from: ${remoteMessage.from}")
        val hasNotificationPayload = remoteMessage.notification != null
        val hasDataPayload = remoteMessage.data.isNotEmpty()

        if (!hasNotificationPayload && !hasDataPayload) {
            Log.d(TAG, "Message has no notification or data payload")
            return
        }

        if (hasNotificationPayload) {
            Log.d(TAG, "Message Notification Body: ${remoteMessage.notification?.body}")
        }
        if (hasDataPayload) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
        }

        val appointmentId = remoteMessage.data["appointmentId"]
        val userId = remoteMessage.data["userId"]

        if (MainApplication.isAppInForeground() &&
            NotificationOpenModule.shouldSuppressNotification(appointmentId ?: "")) {
            Log.d(TAG, "App is in active appointment view, skipping system notification")
            return
        }
        
        val title = remoteMessage.notification?.title ?: remoteMessage.data["title"].orEmpty()
        val messageBody = remoteMessage.notification?.body ?: remoteMessage.data["body"].orEmpty()
        sendNotification(title, messageBody, remoteMessage.data)
    }

    private fun sendNotification(title: String, messageBody: String, data: Map<String, String>) {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        intent.putExtra(EXTRA_NOTIFICATION_OPEN, true)
        
        data.forEach { (key, value) ->
            intent.putExtra(key, value)
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Appointment Notifications"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val safeTitle = if (title.isNotBlank()) title else getString(R.string.app_name)
        val safeMessage = if (messageBody.isNotBlank()) messageBody else "You have a new notification"

        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(safeTitle)
            .setContentText(safeMessage)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())
    }

    private fun sendRegistrationTokenToServer(token: String) {
        Log.d(TAG, "FCM token: $token")
    }
}
