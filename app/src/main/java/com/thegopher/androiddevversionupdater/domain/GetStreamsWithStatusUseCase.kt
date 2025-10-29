package com.thegopher.androiddevversionupdater.domain

import com.thegopher.androiddevversionupdater.data.model.Build
import com.thegopher.androiddevversionupdater.data.model.DevStream
import com.thegopher.androiddevversionupdater.data.repository.StreamRepository
import javax.inject.Inject

data class StreamWithStatus(
    val stream: DevStream,
    val installedVersion: String?,
    val latestBuild: Build?,
    val updateAvailable: Boolean,
    val isInstalled: Boolean
)

class GetStreamsWithStatusUseCase @Inject constructor(
    private val streamRepository: StreamRepository
) {
    suspend operator fun invoke(): Result<List<StreamWithStatus>> {
        return try {
            val streamsResult = streamRepository.fetchStreams()
            if (streamsResult.isFailure) {
                return Result.failure(streamsResult.exceptionOrNull()!!)
            }

            val streams = streamsResult.getOrNull() ?: emptyList()
            val streamsWithStatus = streams.map { stream ->
                val latestBuild = stream.builds.maxByOrNull { it.versionCode }
                val installedVersion = streamRepository.getInstalledVersion(stream.bundleId)
                val installedVersionCode = streamRepository.getInstalledVersionCode(stream.bundleId)
                val isInstalled = installedVersion != null
                val updateAvailable = latestBuild != null && 
                    installedVersionCode != null && 
                    latestBuild.versionCode > installedVersionCode

                StreamWithStatus(
                    stream = stream,
                    installedVersion = installedVersion,
                    latestBuild = latestBuild,
                    updateAvailable = updateAvailable,
                    isInstalled = isInstalled
                )
            }

            Result.success(streamsWithStatus)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
