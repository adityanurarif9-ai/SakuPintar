// Some Windows Node hosts cannot launch npm.cmd through spawn without a shell.
// Resolve only npm to its official JavaScript entrypoint; preserve all other calls.
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import path from 'node:path';
if(process.platform==='win32'){
  const original=childProcess.spawn;
  const npmCli=process.env.SAKU_NPM_CLI||path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  childProcess.spawn=function(command,args,options){
    if(command==='npm')return original(process.execPath,[npmCli,...(args||[])],{...options,windowsVerbatimArguments:false});
    if(path.basename(command).toLowerCase()==='cmd.exe'&&args?.[2]==='/c'&&args[3]?.startsWith('\"\"npm\" ')){
      const tokens=[...args[3].matchAll(/\"([^\"]+)\"/g)].map(match=>match[1]);
      if(tokens[0]==='npm')return original(process.execPath,[npmCli,...tokens.slice(1)],{...options,windowsVerbatimArguments:false});
    }
    return original(command,args,options);
  };
  syncBuiltinESMExports();
}
