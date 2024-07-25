# Cloudflare Purge Cache Action

[![GitHub release](https://img.shields.io/github/release/fishmanlabs/cloudflare-purge-cache-action.svg)](https://github.com/fishmanlabs/cloudflare-purge-cache-action/releases)
[![License](https://img.shields.io/github/license/fishmanlabs/cloudflare-purge-cache-action.svg)](LICENSE)

A GitHub Action to purge cache in Cloudflare zones. This action allows you to
purge everything in a zone, or specific files, tags, hosts, or prefixes.

## Usage

To use this action, add the following step to your GitHub Actions workflow:

```yaml
- name: Cloudflare Purge Cache
  uses: fishmanlabs/cloudflare-purge-cache-action@v1
  with:
    api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    zone_id: ${{ secrets.CLOUDFLARE_ZONE_ID }}
    purge_everything: 'true' # or 'false'
    purge_files: |
      file1.jpg
      file2.css
    purge_tags: |
      tag1
      tag2
    purge_hosts: |
      host1.com
      host2.com
    purge_prefixes: |
      prefix1
      prefix2
```

### Inputs

- `api_token` **(required)**: Cloudflare API token with the following
  permissions: Zone.Cache Purge.
- `zone_id` **(required)**: Cloudflare Zone ID.
- `purge_everything` **(required)**: Purge everything from the zone.
  (`true`/`false`)
- `purge_files` _(optional)_: List of specific files to purge from the zone.
  Ignored if `purge_everything` is `true`. (Newline-separated)
- `purge_tags` _(optional)_: List of specific tags to purge from the zone.
  Ignored if `purge_everything` is `true`. (Newline-separated) _(Enterprise
  only)_
- `purge_hosts` _(optional)_: List of specific hosts to purge from the zone.
  Ignored if `purge_everything` is `true`. (Newline-separated) _(Enterprise
  only)_
- `purge_prefixes` _(optional)_: List of specific prefixes to purge from the
  zone. Ignored if `purge_everything` is `true`. (Newline-separated)
  _(Enterprise only)_

### Development

To contribute to this action, follow these steps:

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Build the project with `npm run build`.
4. Run tests with `npm test`.

### License

This project is licensed under the Unlicense License. See the [LICENSE](LICENSE)
file for details.
