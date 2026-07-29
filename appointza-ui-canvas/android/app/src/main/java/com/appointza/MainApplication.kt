package com.appointza

import android.app.Activity
import android.app.Application
import android.os.Bundle

class MainApplication : Application() {

  companion object {
    @Volatile
    private var startedActivityCount = 0

    fun isAppInForeground(): Boolean = startedActivityCount > 0
  }

  override fun onCreate() {
    super.onCreate()
    registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

      override fun onActivityStarted(activity: Activity) {
        startedActivityCount += 1
      }

      override fun onActivityResumed(activity: Activity) = Unit

      override fun onActivityPaused(activity: Activity) = Unit

      override fun onActivityStopped(activity: Activity) {
        startedActivityCount = maxOf(0, startedActivityCount - 1)
      }

      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

      override fun onActivityDestroyed(activity: Activity) = Unit
    })
  }
}
