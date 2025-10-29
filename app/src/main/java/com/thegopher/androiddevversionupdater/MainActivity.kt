package com.thegopher.androiddevversionupdater

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.work.*
import com.thegopher.androiddevversionupdater.ui.screens.MainScreen
import com.thegopher.androiddevversionupdater.ui.theme.AndroidDevVersionUpdaterTheme
import com.thegopher.androiddevversionupdater.worker.VersionCheckWorker
import dagger.hilt.android.AndroidEntryPoint
import java.util.concurrent.TimeUnit

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Schedule periodic version checks
        scheduleVersionCheck()
        
        setContent {
            AndroidDevVersionUpdaterTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen()
                }
            }
        }
    }

    private fun scheduleVersionCheck() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val versionCheckRequest = PeriodicWorkRequestBuilder<VersionCheckWorker>(
            15, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "version_check",
            ExistingPeriodicWorkPolicy.KEEP,
            versionCheckRequest
        )
    }
}
