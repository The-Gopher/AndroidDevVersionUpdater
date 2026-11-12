# Deploys the apk-indexer to Cloud Run and wires a GCS "object finalized" Eventarc
# trigger to it. Everything it needs except the bucket and the project is created here:
# service account, bucket-scoped IAM, the Eventarc trigger, and an Artifact Registry
# proxy for the public ghcr.io image (Cloud Run cannot pull from ghcr.io directly).

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

data "google_project" "this" {}

# The bucket already exists; this deployment does not create or own it.
data "google_storage_bucket" "builds" {
  name = var.bucket_name
}

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "eventarc.googleapis.com",
    "artifactregistry.googleapis.com",
    "pubsub.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

# ── Image: a pull-through proxy of ghcr.io ──────────────────────────────────────
resource "google_artifact_registry_repository" "ghcr_proxy" {
  location      = var.region
  repository_id = "ghcr-proxy"
  format        = "DOCKER"
  mode          = "REMOTE_REPOSITORY"
  description   = "Pull-through cache of ghcr.io so Cloud Run can run the public apk-indexer image"

  remote_repository_config {
    docker_repository {
      custom_repository {
        uri = "https://ghcr.io"
      }
    }
  }
  depends_on = [google_project_service.apis]
}

locals {
  image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.ghcr_proxy.repository_id}/${var.image_path}:${var.image_tag}"
}

# ── Runtime identity ────────────────────────────────────────────────────────────
resource "google_service_account" "indexer" {
  account_id   = "apk-indexer"
  display_name = "apk-indexer runtime"
}

# Reads the APKs and rewrites streams.json. Overwriting an object needs
# storage.objects.delete as well as create, so objectUser (get, list, create, update,
# delete) is the smallest predefined role that works. Scoped to this one bucket.
resource "google_storage_bucket_iam_member" "indexer" {
  bucket = data.google_storage_bucket.builds.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.indexer.email}"
}

resource "google_cloud_run_v2_service" "indexer" {
  name                = "apk-indexer"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.indexer.email
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
    containers {
      image = local.image
      env {
        name  = "BUCKET"
        value = data.google_storage_bucket.builds.name
      }
      resources {
        limits = {
          memory = "256Mi"
          cpu    = "1"
        }
      }
    }
  }
  depends_on = [google_project_service.apis, google_storage_bucket_iam_member.indexer]
}

# ── Trigger ─────────────────────────────────────────────────────────────────────
resource "google_service_account" "trigger" {
  account_id   = "apk-indexer-trigger"
  display_name = "apk-indexer Eventarc trigger"
}

resource "google_project_iam_member" "trigger_receiver" {
  project = var.project_id
  role    = "roles/eventarc.eventReceiver"
  member  = "serviceAccount:${google_service_account.trigger.email}"
}

resource "google_cloud_run_v2_service_iam_member" "trigger_invoker" {
  name     = google_cloud_run_v2_service.indexer.name
  location = google_cloud_run_v2_service.indexer.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.trigger.email}"
}

# A GCS-sourced trigger will not deliver unless Cloud Storage's own service agent may
# publish to Pub/Sub.
data "google_storage_project_service_account" "gcs" {}

resource "google_project_iam_member" "gcs_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${data.google_storage_project_service_account.gcs.email_address}"
}

resource "google_eventarc_trigger" "apk_uploaded" {
  name            = "apk-indexer-object-finalized"
  location        = data.google_storage_bucket.builds.location == "US" ? "us" : lower(data.google_storage_bucket.builds.location)
  service_account = google_service_account.trigger.email

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.storage.object.v1.finalized"
  }
  matching_criteria {
    attribute = "bucket"
    value     = data.google_storage_bucket.builds.name
  }

  destination {
    cloud_run_service {
      service = google_cloud_run_v2_service.indexer.name
      region  = var.region
    }
  }

  depends_on = [
    google_project_iam_member.trigger_receiver,
    google_project_iam_member.gcs_pubsub,
    google_cloud_run_v2_service_iam_member.trigger_invoker,
  ]
}

# ── Optional: let phones read streams.json and the APKs without credentials ─────
resource "google_storage_bucket_iam_member" "public_read" {
  count  = var.make_bucket_public ? 1 : 0
  bucket = data.google_storage_bucket.builds.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

output "streams_url" {
  description = "Base URL to put in the app's QR code"
  value       = "https://storage.googleapis.com/${data.google_storage_bucket.builds.name}/"
}
