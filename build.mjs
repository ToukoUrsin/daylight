import{mkdir,copyFile}from'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','app.mjs','engine.mjs','style.css','sun.svg','README.md','LICENSE','.nojekyll'])await copyFile(file,`dist/${file}`);
console.log('Static site written to dist/. No runtime dependencies.');
