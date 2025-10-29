package com.thegopher.androiddevversionupdater.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.thegopher.androiddevversionupdater.data.repository.StreamRepository
import com.thegopher.androiddevversionupdater.util.NotificationHelper
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class VersionCheckWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val streamRepository: StreamRepository,
    private val notificationHelper: NotificationHelper
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val streamsResult = streamRepository.fetchStreams()
            if (streamsResult.isSuccess) {
                val streams = streamsResult.getOrNull() ?: emptyList()
                
                streams.forEach { stream ->
                    val latestBuild = stream.builds.maxByOrNull { it.versionCode }
                    val installedVersionCode = streamRepository.getInstalledVersionCode(stream.bundleId)
                    
                    if (latestBuild != null && installedVersionCode != null) {
                        if (latestBuild.versionCode > installedVersionCode) {
                            notificationHelper.showUpdateNotification(stream.streamName)
                        }
                    }
                }
            }
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }
}
