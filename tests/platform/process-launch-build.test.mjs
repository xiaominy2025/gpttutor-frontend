import{it,expect}from'vitest';import{spawnSync}from'node:child_process';
it('refuses Process activation for a production build before writing artifacts',()=>{const r=spawnSync(process.execPath,['scripts/build-release-b.mjs','prod','--enable-local-ui','--enable-process-coach'],{encoding:'utf8',windowsHide:true});expect(r.status).toBe(1);expect(r.stderr).toContain('production remains off');});
