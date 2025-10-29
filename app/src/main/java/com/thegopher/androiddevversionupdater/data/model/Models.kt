package com.thegopher.androiddevversionupdater.data.model

import com.google.gson.annotations.SerializedName

data class DevStream(
    @SerializedName("streamName")
    val streamName: String,
    @SerializedName("bundleId")
    val bundleId: String,
    @SerializedName("builds")
    val builds: List<Build>
)

data class Build(
    @SerializedName("version")
    val version: String,
    @SerializedName("versionCode")
    val versionCode: Int,
    @SerializedName("downloadUrl")
    val downloadUrl: String,
    @SerializedName("releaseDate")
    val releaseDate: String? = null
)

data class StreamsResponse(
    @SerializedName("streams")
    val streams: List<DevStream>
)
