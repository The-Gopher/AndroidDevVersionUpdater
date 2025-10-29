package com.thegopher.androiddevversionupdater.data.repository

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.thegopher.androiddevversionupdater.data.model.DevStream
import com.thegopher.androiddevversionupdater.data.remote.ApiService
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Inject
import javax.inject.Singleton

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

@Singleton
class StreamRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val okHttpClient: OkHttpClient
) {
    companion object {
        private val API_URL_KEY = stringPreferencesKey("api_url")
    }

    private val dataStore = context.dataStore

    suspend fun saveApiUrl(url: String) {
        dataStore.edit { preferences ->
            preferences[API_URL_KEY] = url
        }
    }

    fun getApiUrl(): Flow<String?> {
        return dataStore.data.map { preferences ->
            preferences[API_URL_KEY]
        }
    }

    suspend fun fetchStreams(): Result<List<DevStream>> {
        return try {
            val url = getApiUrl().firstOrNull()
            if (url.isNullOrBlank()) {
                return Result.failure(Exception("No API URL configured"))
            }

            val retrofit = Retrofit.Builder()
                .baseUrl(url)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            val apiService = retrofit.create(ApiService::class.java)
            val response = apiService.getStreams()
            Result.success(response.streams)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getInstalledVersion(packageName: String): String? {
        return try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    packageName,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(packageName, 0)
            }
            packageInfo.versionName
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }
    }

    fun getInstalledVersionCode(packageName: String): Long? {
        return try {
            val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.packageManager.getPackageInfo(
                    packageName,
                    PackageManager.PackageInfoFlags.of(0)
                )
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(packageName, 0)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                packageInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toLong()
            }
        } catch (e: PackageManager.NameNotFoundException) {
            null
        }
    }

    fun isPackageInstalled(packageName: String): Boolean {
        return getInstalledVersion(packageName) != null
    }
}
