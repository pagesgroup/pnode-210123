
1 low severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

C:\Users\Justin\Documents\GitHub\pnode-210123>node
Welcome to Node.js v22.18.0.
Type ".help" for more information.
>
(To exit, press Ctrl+C again or Ctrl+D or type .exit)
>

C:\Users\Justin\Documents\GitHub\pnode-210123>node index
node:internal/modules/cjs/loader:1368
  throw err;
  ^

Error: Cannot find module '@pagesgroup/pnode'
Require stack:
- C:\Users\Justin\Documents\GitHub\pnode-210123\index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1365:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1021:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1026:22)
    at Function._load (node:internal/modules/cjs/loader:1175:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1445:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (C:\Users\Justin\Documents\GitHub\pnode-210123\index.js:1:15)
    at Module._compile (node:internal/modules/cjs/loader:1688:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ 'C:\\Users\\Justin\\Documents\\GitHub\\pnode-210123\\index.js' ]
}

Node.js v22.18.0

C:\Users\Justin\Documents\GitHub\pnode-210123>cd ..

C:\Users\Justin\Documents\GitHub>cd pnode

C:\Users\Justin\Documents\GitHub\pnode>npm link

added 1 package, and audited 3 packages in 656ms

found 0 vulnerabilities

C:\Users\Justin\Documents\GitHub\pnode>cd pnode-210123
The system cannot find the path specified.

C:\Users\Justin\Documents\GitHub\pnode>node index
node:internal/modules/cjs/loader:1368
  throw err;
  ^

Error: Cannot find module 'C:\Users\Justin\Documents\GitHub\pnode\index'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1365:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1021:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1026:22)
    at Function._load (node:internal/modules/cjs/loader:1175:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.18.0

C:\Users\Justin\Documents\GitHub\pnode>npm link @pagesgroup/pnode

added 377 packages, and audited 378 packages in 9s

59 packages are looking for funding
  run `npm fund` for details

1 low severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

C:\Users\Justin\Documents\GitHub\pnode>npm link

up to date, audited 3 packages in 693ms

found 0 vulnerabilities

C:\Users\Justin\Documents\GitHub\pnode>cd pnode-210123
The system cannot find the path specified.

C:\Users\Justin\Documents\GitHub\pnode>cd ..

C:\Users\Justin\Documents\GitHub>cd pnode-210123

C:\Users\Justin\Documents\GitHub\pnode-210123>npm link @pagesgroup/pnode

added 1 package, and audited 381 packages in 976ms

60 packages are looking for funding
  run `npm fund` for details

1 low severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

C:\Users\Justin\Documents\GitHub\pnode-210123>node index
Express server listening at http://localhost:80
Server draait op: opc.tcp://POL-LP037.POLYMAC.INTRA:4334/UA/NodeServer

C:\Users\Justin\Documents\GitHub\pnode-210123>node justin
HALLO

C:\Users\Justin\Documents\GitHub\pnode-210123>node index
Starting Express webserver...
Express server listening at http://localhost:80
Server draait op: opc.tcp://POL-LP037.POLYMAC.INTRA:4334/UA/NodeServer

C:\Users\Justin\Documents\GitHub\pnode-210123>node index
Starting Express webserver...
Starting OPC UA server...
Express server listening at http://localhost:80
Server draait op: opc.tcp://POL-LP037.POLYMAC.INTRA:4334/UA/NodeServer
11:07:49.786Z :opcua_server                  :417   Cannot find suitable endpoints in available endpoints. endpointUri = opc.tcp://192.168.122.160:4334/UA/NodeServer
11:07:49.834Z :opcua_server                  :417   Cannot find suitable endpoints in available endpoints. endpointUri = opc.tcp://192.168.122.160:4334/UA/NodeServer

C:\Users\Justin\Documents\GitHub\pnode-210123>npm i ethernet-ip

added 3 packages, removed 1 package, and audited 382 packages in 2s

60 packages are looking for funding
  run `npm fund` for details

1 low severity vulnerability

To address all issues, run:
  npm audit fix

Run `npm audit` for details.

C:\Users\Justin\Documents\GitHub\pnode-210123>node plc
Fout bij PLC-verbinding: Error: TIMEOUT occurred while attempting to establish TCP connection with Controller.
    at Controller.connect (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\enip\index.js:109:28)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Controller.connect (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:118:24)
    at async C:\Users\Justin\Documents\GitHub\pnode-210123\plc.js:8:5
^C
C:\Users\Justin\Documents\GitHub\pnode-210123>node plc
Verbonden met PLC: {
  name: '5069-L340ERMS3/A',
  serial_number: 3491278188,
  slot: 0,
  time: null,
  path: <Buffer 01 00>,
  version: '36.11',
  status: 12384,
  faulted: false,
  minorRecoverableFault: false,
  minorUnrecoverableFault: false,
  majorRecoverableFault: false,
  majorUnrecoverableFault: false,
  io_faulted: false
}
Fout bij PLC-verbinding: TypeError: tag.generateReadMessageRequest is not a function
    at Controller._readTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:477:24)
    at TaskEasy._runTask (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:118:9)
    at TaskEasy._next (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:138:18)
    at C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:56:22
    at new Promise (<anonymous>)
    at TaskEasy.schedule (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:51:16)
    at Controller.readTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:339:34)
    at C:\Users\Justin\Documents\GitHub\pnode-210123\plc.js:13:29
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
^C
C:\Users\Justin\Documents\GitHub\pnode-210123>node plc
Verbonden met PLC: {
  name: '5069-L340ERMS3/A',
  serial_number: 3491278188,
  slot: 0,
  time: null,
  path: <Buffer 01 00>,
  version: '36.11',
  status: 12384,
  faulted: false,
  minorRecoverableFault: false,
  minorUnrecoverableFault: false,
  majorRecoverableFault: false,
  majorUnrecoverableFault: false,
  io_faulted: false
}
Fout bij PLC-verbinding: TypeError: tag.generateReadMessageRequest is not a function
    at Controller._readTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:477:24)
    at TaskEasy._runTask (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:118:9)
    at TaskEasy._next (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:138:18)
    at C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:56:22
    at new Promise (<anonymous>)
    at TaskEasy.schedule (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:51:16)
    at Controller.readTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:339:34)
    at C:\Users\Justin\Documents\GitHub\pnode-210123\plc.js:13:29
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
^C
C:\Users\Justin\Documents\GitHub\pnode-210123>
C:\Users\Justin\Documents\GitHub\pnode-210123>node plc
Verbonden met PLC: {
  name: '5069-L340ERMS3/A',
  serial_number: 3491278188,
  slot: 0,
  time: null,
  path: <Buffer 01 00>,
  version: '36.11',
  status: 12384,
  faulted: false,
  minorRecoverableFault: false,
  minorUnrecoverableFault: false,
  majorRecoverableFault: false,
  majorUnrecoverableFault: false,
  io_faulted: false
}
Tagwaarde: null
C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\tag\index.js:450
            throw new Error(
                  ^

Error: Tag udtBatchRunParametersLine1 has not been initialized. Try reading the tag from the controller first or manually providing a valid CIP datatype.
    at Tag.generateWriteMessageRequest (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\tag\index.js:450:19)
    at Controller._writeTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:510:24)
    at TaskEasy._runTask (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:118:9)
    at TaskEasy._next (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:138:18)
    at C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:56:22
    at new Promise (<anonymous>)
    at TaskEasy.schedule (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:51:16)
    at Controller.writeTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:355:35)
    at Timeout._onTimeout (C:\Users\Justin\Documents\GitHub\pnode-210123\plc.js:24:17)
    at listOnTimeout (node:internal/timers:588:17)

Node.js v22.18.0

C:\Users\Justin\Documents\GitHub\pnode-210123>

C:\Users\Justin\Documents\GitHub\pnode-210123>node plc
Verbonden met PLC: {
  name: '5069-L340ERMS3/A',
  serial_number: 3491278188,
  slot: 0,
  time: null,
  path: <Buffer 01 00>,
  version: '36.11',
  status: 12384,
  faulted: false,
  minorRecoverableFault: false,
  minorUnrecoverableFault: false,
  majorRecoverableFault: false,
  majorUnrecoverableFault: false,
  io_faulted: false
}
Tagwaarde: null
C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\tag\index.js:450
            throw new Error(
                  ^

Error: Tag udtBatchRunParametersLine1.diSet_AmountOfProducts has not been initialized. Try reading the tag from the controller first or manually providing a valid CIP datatype.
    at Tag.generateWriteMessageRequest (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\tag\index.js:450:19)
    at Controller._writeTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:510:24)
    at TaskEasy._runTask (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:118:9)
    at TaskEasy._next (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:138:18)
    at C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:56:22
    at new Promise (<anonymous>)
    at TaskEasy.schedule (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\task-easy\src\index.js:51:16)
    at Controller.writeTag (C:\Users\Justin\Documents\GitHub\pnode-210123\node_modules\ethernet-ip\src\controller\index.js:355:35)
    at Timeout._onTimeout (C:\Users\Justin\Documents\GitHub\pnode-210123\plc.js:24:17)
    at listOnTimeout (node:internal/timers:588:17)

Node.js v22.18.0

C:\Users\Justin\Documents\GitHub\pnode-210123>

C:\Users\Justin\Documents\GitHub\pnode-210123>node plc
Verbonden met PLC: {
  name: '5069-L340ERMS3/A',
  serial_number: 3491278188,
  slot: 0,
  time: null,
  path: <Buffer 01 00>,
  version: '36.11',
  status: 12384,
  faulted: false,
  minorRecoverableFault: false,
  minorUnrecoverableFault: false,
  majorRecoverableFault: false,
  majorUnrecoverableFault: false,
  io_faulted: false
}
Eerste waarde: 6 Type: undefined
Tagwaarde: 6
Tag geschreven!
node:events:496
      throw er; // Unhandled 'error' event
      ^

Error: read ECONNRESET
    at TCP.onStreamRead (node:internal/stream_base_commons:216:20)
Emitted 'error' event on Controller instance at:
    at emitErrorNT (node:internal/streams/destroy:170:8)
    at emitErrorCloseNT (node:internal/streams/destroy:129:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  errno: -4077,
  code: 'ECONNRESET',