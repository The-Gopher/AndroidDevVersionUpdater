package com.thegopher.androiddevversionupdater.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.thegopher.androiddevversionupdater.domain.StreamWithStatus
import com.thegopher.androiddevversionupdater.ui.components.QRCodeScanner

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val downloadState by viewModel.downloadState.collectAsState()
    val showQrScanner by viewModel.showQrScanner.collectAsState()

    // Show error dialog for download failures
    if (downloadState is DownloadState.Error) {
        AlertDialog(
            onDismissRequest = { viewModel.clearDownloadError() },
            title = { Text("Download Error") },
            text = { Text((downloadState as DownloadState.Error).message) },
            confirmButton = {
                TextButton(onClick = { viewModel.clearDownloadError() }) {
                    Text("OK")
                }
            }
        )
    }

    if (showQrScanner) {
        QRCodeScanner(
            onQRCodeScanned = { url -> viewModel.onQrCodeScanned(url) },
            onDismiss = { viewModel.hideQrScanner() }
        )
    } else {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Dev Version Updater") },
                    actions = {
                        IconButton(onClick = { viewModel.showQrScanner() }) {
                            Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan QR Code")
                        }
                        IconButton(onClick = { viewModel.refreshStreams() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                        }
                    }
                )
            }
        ) { padding ->
            when (val state = uiState) {
                is MainUiState.Loading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                is MainUiState.NoUrlConfigured -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                Icons.Default.QrCodeScanner,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("No URL configured")
                            Text("Scan a QR code to get started", style = MaterialTheme.typography.bodySmall)
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.showQrScanner() }) {
                                Text("Scan QR Code")
                            }
                        }
                    }
                }
                is MainUiState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                Icons.Default.Error,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Error: ${state.message}")
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { viewModel.refreshStreams() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                is MainUiState.Success -> {
                    if (state.streams.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(padding),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No streams available")
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(padding),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.streams) { streamWithStatus ->
                                StreamCard(
                                    streamWithStatus = streamWithStatus,
                                    onInstallClick = { stream, build ->
                                        viewModel.downloadAndInstall(
                                            stream.streamName,
                                            build.downloadUrl,
                                            build.version
                                        )
                                    },
                                    isDownloading = downloadState is DownloadState.Downloading &&
                                            (downloadState as DownloadState.Downloading).streamName == streamWithStatus.stream.streamName
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StreamCard(
    streamWithStatus: StreamWithStatus,
    onInstallClick: (com.thegopher.androiddevversionupdater.data.model.DevStream, com.thegopher.androiddevversionupdater.data.model.Build) -> Unit,
    isDownloading: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = streamWithStatus.stream.streamName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = streamWithStatus.stream.bundleId,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                
                StatusBadge(streamWithStatus)
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (streamWithStatus.isInstalled) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Installed: ${streamWithStatus.installedVersion}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    if (streamWithStatus.latestBuild != null) {
                        Text(
                            text = "Latest: ${streamWithStatus.latestBuild.version}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            } else if (streamWithStatus.latestBuild != null) {
                Text(
                    text = "Latest: ${streamWithStatus.latestBuild.version}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (streamWithStatus.latestBuild != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = { onInstallClick(streamWithStatus.stream, streamWithStatus.latestBuild) },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isDownloading
                ) {
                    if (isDownloading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Downloading...")
                    } else {
                        Text(if (streamWithStatus.updateAvailable) "Update" else if (streamWithStatus.isInstalled) "Reinstall" else "Install")
                    }
                }
            }
        }
    }
}

@Composable
fun StatusBadge(streamWithStatus: StreamWithStatus) {
    val (text, color) = when {
        streamWithStatus.updateAvailable -> "Update Available" to MaterialTheme.colorScheme.primary
        streamWithStatus.isInstalled -> "Up to Date" to MaterialTheme.colorScheme.tertiary
        else -> "Not Installed" to MaterialTheme.colorScheme.secondary
    }

    Surface(
        color = color,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimary
        )
    }
}
