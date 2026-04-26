## GitHub Copilot Chat

- Extension: 0.39.2 (prod)
- VS Code: 1.111.0 (ce099c1ed25d9eb3076c11e4a280f3eb52b4fbeb)
- OS: win32 10.0.22631 x64
- GitHub Account: BrianTukei

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: Error (2 ms): getaddrinfo ENOTFOUND api.github.com
- DNS ipv6 Lookup: Error (3 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (24 ms)
- Electron fetch (configured): Error (186 ms): Error: net::ERR_INTERNET_DISCONNECTED
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
	at SimpleURLLoaderWrapper.emit (node:domain:489:12)
	at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
	at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (150 ms): Error: getaddrinfo ENOTFOUND api.github.com
	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (116 ms): TypeError: fetch failed
	at node:internal/deps/undici/undici:14902:13
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async n._fetch (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5075:5229)
	at async n.fetch (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5075:4541)
	at async u (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5107:186)
	at async Zm._executeContributedCommand (file:///c:/Users/J0SC0M/AppData/Local/Programs/Microsoft%20VS%20Code/ce099c1ed2/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND api.github.com
  	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: Error (5 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- DNS ipv6 Lookup: Error (3 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (40 ms)
- Electron fetch (configured): Error (5 ms): Error: net::ERR_INTERNET_DISCONNECTED
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
	at SimpleURLLoaderWrapper.emit (node:domain:489:12)
	at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
	at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (37 ms): Error: getaddrinfo ENOTFOUND api.githubcopilot.com
	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (42 ms): TypeError: fetch failed
	at node:internal/deps/undici/undici:14902:13
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async n._fetch (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5075:5229)
	at async n.fetch (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5075:4541)
	at async u (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5107:186)
	at async Zm._executeContributedCommand (file:///c:/Users/J0SC0M/AppData/Local/Programs/Microsoft%20VS%20Code/ce099c1ed2/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND api.githubcopilot.com
  	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: Error (3 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- DNS ipv6 Lookup: Error (4 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (38 ms)
- Electron fetch (configured): Error (4 ms): Error: net::ERR_INTERNET_DISCONNECTED
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
	at SimpleURLLoaderWrapper.emit (node:domain:489:12)
	at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
	at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
- Node.js https: Error (27 ms): Error: getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
- Node.js fetch: Error (48 ms): TypeError: fetch failed
	at node:internal/deps/undici/undici:14902:13
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async n._fetch (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5075:5229)
	at async n.fetch (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5075:4541)
	at async u (c:\Users\J0SC0M\.vscode\extensions\github.copilot-chat-0.39.2\dist\extension.js:5107:186)
	at async Zm._executeContributedCommand (file:///c:/Users/J0SC0M/AppData/Local/Programs/Microsoft%20VS%20Code/ce099c1ed2/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:494:48675)
  Error: getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
  	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
  	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Connecting to https://mobile.events.data.microsoft.com: Error (5 ms): Error: net::ERR_INTERNET_DISCONNECTED
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
	at SimpleURLLoaderWrapper.emit (node:domain:489:12)
	at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
	at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
Connecting to https://dc.services.visualstudio.com: Error (5 ms): Error: net::ERR_INTERNET_DISCONNECTED
	at SimpleURLLoaderWrapper.<anonymous> (node:electron/js2c/utility_init:2:10684)
	at SimpleURLLoaderWrapper.emit (node:events:519:28)
	at SimpleURLLoaderWrapper.emit (node:domain:489:12)
	at SimpleURLLoaderWrapper.topLevelDomainCallback (node:domain:161:15)
	at SimpleURLLoaderWrapper.callbackTrampoline (node:internal/async_hooks:128:24)
  [object Object]
  {"is_request_error":true,"network_process_crashed":false}
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: Error (35 ms): Error: getaddrinfo ENOTFOUND copilot-telemetry.githubusercontent.com
	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: Error (38 ms): Error: getaddrinfo ENOTFOUND copilot-telemetry.githubusercontent.com
	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)
Connecting to https://default.exp-tas.com: Error (29 ms): Error: getaddrinfo ENOTFOUND default.exp-tas.com
	at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:122:26)
	at GetAddrInfoReqWrap.callbackTrampoline (node:internal/async_hooks:130:17)

Number of system certificates: 71

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).