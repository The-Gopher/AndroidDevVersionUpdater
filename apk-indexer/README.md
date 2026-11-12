# apk-indexer

Keeps the `streams.json` that AndroidDevVersionUpdater reads in step with the APKs your
CI uploads to a Google Cloud Storage bucket, so nobody maintains that file by hand.

```
CI uploads app.apk ──► Eventarc (object finalized) ──► apk-indexer (Cloud Run) ──► streams.json
                                                         │ range-reads the zip directory + manifest
                                                         └─ compare-and-swap write (ifGenerationMatch)
```

For each new `*.apk` it reads the package name, `versionCode` and `versionName` from the
APK's compiled `AndroidManifest.xml`, and merges the build into `streams.json` at the
bucket root. The app polls that file and notifies you when an installed app has a newer
build.

## Output

`https://storage.googleapis.com/<bucket>/streams.json`

```json
{
  "streams": [
    {
      "streamName": "myapp-qa",
      "bundleId": "com.example.myapp.qa",
      "builds": [
        {
          "version": "1.37-QA",
          "versionCode": 412,
          "downloadUrl": "https://storage.googleapis.com/<bucket>/myapp-qa/<sha>/app.apk",
          "releaseDate": "2026-11-12T16:30:00.000Z",
          "abis": ["arm64-v8a"]
        }
      ]
    }
  ]
}
```

- A stream is a **bundle ID**. `streamName` is the top-level folder of the latest upload,
  so lay your bucket out as `<name>/<anything>/<file>.apk`.
- The newest 5 builds are kept **per bundle ID and ABI set**, newest `versionCode` first.
- `abis` lists the `lib/<abi>/` folders in the APK; empty means no native code. With
  per-ABI split builds the ABI is often folded into `versionCode`, so the highest code
  for a bundle ID can be an APK a phone cannot install. The app picks among builds its
  device can run, which is why the field exists.

## Deploy

The image is published to GitHub Container Registry on every merge to `main`:

```
ghcr.io/the-gopher/androiddevversionupdater-apk-indexer:latest
```

Pin a release tag (`apk-indexer-vX.Y.Z` publishes `X.Y.Z`) rather than following `latest`.

### Cloud Run, with Terraform

`deploy/terraform` creates everything except the bucket: a Cloud Run service, its service
account (object access on that one bucket only), the Eventarc trigger and the roles it
needs, and an Artifact Registry pull-through proxy for the ghcr.io image (Cloud Run cannot
pull from ghcr.io directly).

```bash
cd apk-indexer/deploy/terraform
terraform init
terraform apply \
  -var project_id=my-project \
  -var bucket_name=my-apk-bucket \
  -var image_tag=1.0.0
```

The output `streams_url` is what the app's QR code should encode. The phone fetches
`streams.json` and the APKs with no credentials, so the bucket must be readable by
`allUsers`. Pass `-var make_bucket_public=true` to grant that, which makes **every object
in the bucket** world-readable. Do not do it to a bucket that holds anything private.

> The module passes `terraform validate` but has not been applied against a real project.
> Read the plan before applying. Eventarc requires the trigger's location to match the
> bucket's; the module handles single regions and the `US` multi-region and nothing else.

### Anywhere else

The image is a standard HTTP server that accepts CloudEvents on `$PORT` (default 8080):

```bash
docker run --rm -p 8080:8080 ghcr.io/the-gopher/androiddevversionupdater-apk-indexer:latest
```

It needs Application Default Credentials that can read objects and write `streams.json`
in the bucket (`roles/storage.objectUser` on the bucket). Overwriting an object needs
`storage.objects.delete` as well as create, so `objectCreator` alone is not enough.
Set `BUCKET=<name>` to make it refuse events from any other bucket.

## Behaviour worth knowing

- **Concurrent uploads are the normal case.** A build that makes several flavors uploads
  them within seconds of each other. Every write is `ifGenerationMatch`; a lost race
  re-reads and retries (8 attempts with jitter), then fails so Eventarc redelivers.
- **Idempotent.** Events are at-least-once. A redelivered event merges to an identical
  document and skips the write.
- **Only the manifest is downloaded**, via HTTP range reads of the zip's central directory
  and the one entry: about 0.3 MB of a 70 MB APK.
- **Not an APK, or a corrupt one:** logged and acknowledged without retry, since it would
  fail identically next time. Storage or network errors do fail and are retried.
- **Its own write fires it again** (same bucket). The `.apk` suffix check ends that.
- `streams.json` is written with `Cache-Control: no-cache` because the phone polls it.

## Develop

```bash
npm ci
npm test
npm run build
docker build -t apk-indexer .
```

The manifest parser (`src/axml.ts`) reads only the three `<manifest>` attributes it needs
and is not a general AXML decoder. It is tested against a manifest compiled by the Android
Gradle plugin and synthetic UTF-8 and UTF-16 string pools.
