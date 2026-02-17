# 365integration

Welcome to my Adobe I/O Application!

## Setup

- Populate the `.env` file in the project root and fill it as shown [below](#env)

## Local Dev

- `aio app run` to start your local Dev server
- App will run on `localhost:9080` by default

By default the UI will be served locally but actions will be deployed and served from Adobe I/O Runtime. To run your actions locally use the `aio app dev` option.

For more information on the difference between `aio app run` and `aio app dev`, see [here](https://developer.adobe.com/app-builder/docs/guides/development/#aio-app-dev-vs-aio-app-run)

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions
- Run `aio app test --e2e` to run e2e tests

### Deploying to Sandbox/Stage

```bash
# Switch to Stage workspace (if not already)
aio app use -w Stage

# Deploy using default config
aio app deploy
```

### Deploying to Production

```bash
# Switch to Production workspace
aio app use -w Production

### Cleanup

- `aio app undeploy` to undeploy the app from current workspace

### Quick Reference

| Command | Description |
|---------|-------------|
| `aio app use -l` | List available workspaces |
| `aio app use -w <name>` | Switch to a workspace |
| `aio app deploy` | Deploy to current workspace (Stage) |
| `aio app deploy --config-file app.config.prod.yaml` | Deploy with production D365 config |

## Config

### `.env`

You can generate this file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

## Adobe I/O Runtime credentials (auto-populated by `aio app use`)
AIO_runtime_auth=
AIO_runtime_namespace=
AIO_runtime_apihost=https://adobeioruntime.net

## Mailchimp credential
MAILCHIMP_API_KEY=your-api-key-here
MAILCHIMP_SERVER=us6
MAILCHIMP_LIST_ID=your-list-id-here

```
