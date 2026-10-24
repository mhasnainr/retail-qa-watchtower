const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.csv':'text/csv','.md':'text/markdown','.txt':'text/plain','.svg':'image/svg+xml','.gif':'image/gif','.png':'image/png','.webp':'image/webp'};
function createServer(){return http.createServer((req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    const type=mime[path.extname(file)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':/^(text\/|application\/json)/.test(type)?type+'; charset=utf-8':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
});}
if(require.main===module){const port=Number(process.env.PORT)||8080;createServer().listen(port,'127.0.0.1',()=>console.log('Open http://127.0.0.1:'+port));}
module.exports={createServer};
