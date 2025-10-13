package com.thegopher.androiddevversionupdater.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.thegopher.androiddevversionupdater.data.repository.StreamRepository
import com.thegopher.androiddevversionupdater.domain.GetStreamsWithStatusUseCase
import com.thegopher.androiddevversionupdater.domain.StreamWithStatus
import com.thegopher.androiddevversionupdater.util.ApkDownloader
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface MainUiState {
    object Loading : MainUiState
    data class Success(val streams: List<StreamWithStatus>) : MainUiState
    data class Error(val message: String) : MainUiState
    object NoUrlConfigured : MainUiState
}

sealed interface DownloadState {
    object Idle : DownloadState
    data class Downloading(val streamName: String) : DownloadState
    data class Error(val message: String) : DownloadState
}

@HiltViewModel
class MainViewModel @Inject constructor(
    private val streamRepository: StreamRepository,
    private val getStreamsWithStatusUseCase: GetStreamsWithStatusUseCase,
    private val apkDownloader: ApkDownloader
) : ViewModel() {

    private val _uiState = MutableStateFlow<MainUiState>(MainUiState.Loading)
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val _downloadState = MutableStateFlow<DownloadState>(DownloadState.Idle)
    val downloadState: StateFlow<DownloadState> = _downloadState.asStateFlow()

    private val _showQrScanner = MutableStateFlow(false)
    val showQrScanner: StateFlow<Boolean> = _showQrScanner.asStateFlow()

    val apiUrl: StateFlow<String?> = streamRepository.getApiUrl()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    init {
        viewModelScope.launch {
            apiUrl.collect { url ->
                if (url != null) {
                    refreshStreams()
                } else {
                    _uiState.value = MainUiState.NoUrlConfigured
                }
            }
        }
    }

    fun refreshStreams() {
        viewModelScope.launch {
            _uiState.value = MainUiState.Loading
            val result = getStreamsWithStatusUseCase()
            _uiState.value = if (result.isSuccess) {
                MainUiState.Success(result.getOrNull() ?: emptyList())
            } else {
                MainUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
            }
        }
    }

    fun showQrScanner() {
        _showQrScanner.value = true
    }

    fun hideQrScanner() {
        _showQrScanner.value = false
    }

    fun onQrCodeScanned(url: String) {
        viewModelScope.launch {
            streamRepository.saveApiUrl(url)
            hideQrScanner()
        }
    }

    fun downloadAndInstall(streamName: String, downloadUrl: String, version: String) {
        viewModelScope.launch {
            _downloadState.value = DownloadState.Downloading(streamName)
            val fileName = "${streamName.replace(" ", "_")}_${version}.apk"
            val result = apkDownloader.downloadAndInstall(downloadUrl, fileName)
            _downloadState.value = if (result.isSuccess) {
                DownloadState.Idle
            } else {
                DownloadState.Error(result.exceptionOrNull()?.message ?: "Download failed")
            }
        }
    }

    fun clearDownloadError() {
        _downloadState.value = DownloadState.Idle
    }
}
