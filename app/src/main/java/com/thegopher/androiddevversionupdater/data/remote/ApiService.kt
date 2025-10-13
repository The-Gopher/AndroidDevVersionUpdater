package com.thegopher.androiddevversionupdater.data.remote

import com.thegopher.androiddevversionupdater.data.model.StreamsResponse
import retrofit2.http.GET

interface ApiService {
    @GET(".")
    suspend fun getStreams(): StreamsResponse
}
