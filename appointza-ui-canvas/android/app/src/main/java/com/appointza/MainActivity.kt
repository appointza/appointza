package com.appointza

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.appointza.NotificationOpenModule

class MainActivity : BridgeActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleIntent(intent)
  }

  private fun handleIntent(intent: Intent?) {
    handleNotificationIntent(intent)
  }

  private fun handleNotificationIntent(intent: Intent?) {
    if (intent == null) return
    
    val isNotificationOpen = intent.getBooleanExtra("notification_open", false)
    val chatroomId = intent.getStringExtra("chatroomid")
    val hasChatroomId = !chatroomId.isNullOrBlank()

    if (isNotificationOpen || hasChatroomId) {
      NotificationOpenModule.setIntent(intent)
    }
  }
}
