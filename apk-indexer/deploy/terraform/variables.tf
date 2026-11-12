variable "project_id" {
  description = "GCP project to deploy into (the one that holds the bucket)."
  type        = string
}

variable "region" {
  description = "Region for Cloud Run and the image proxy."
  type        = string
  default     = "us-central1"
}

variable "bucket_name" {
  description = "Existing bucket your CI uploads APKs to. streams.json is written to its root."
  type        = string
}

variable "image_path" {
  description = "Image path on ghcr.io, without the registry or tag."
  type        = string
  default     = "the-gopher/androiddevversionupdater-apk-indexer"
}

variable "image_tag" {
  description = "Image tag. Pin to a release (e.g. 1.0.0) rather than following latest."
  type        = string
  default     = "latest"
}

variable "make_bucket_public" {
  description = "Grant allUsers read on the whole bucket so the phone needs no credentials. Fails if the bucket enforces public access prevention. Every object in the bucket becomes world-readable."
  type        = bool
  default     = false
}
